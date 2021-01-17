import { Room, RoomPublic } from './../../interfaces';
import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';

const apiRouter = Router();

/** getRooms$ */
apiRouter.get('/rooms', async (req: Request, res: Response) => {
  const rooms: any[] = Object.values(
    (
      await admin
        .database()
        .ref('rooms')
        .orderByChild('public/status')
        .equalTo('waiting')
        .get()
    ).val() || {}
  );

  const availableRoomPublics: any[] = rooms
    ? rooms
        .filter((r) => r.public.config?.public)
        .sort((a, b) => b.public.timestamp - a.public.timestamp)
        .slice(0, 15)
        .map((room: any) => {
          room.public['hostName'] = room.public.players?.find(
            (p: any) => p.host
          ).name;
          return room.public;
        })
    : [];

  return res.send(availableRoomPublics);
});

/** newRoom$ */
apiRouter.post('/rooms', async (req: Request, res: Response) => {
  const roomCode = makeId(4);
  const hostName = (await admin.auth().getUser(res.locals.user.uid))
    .displayName;
  
  const _reset = await resetRoom(
    roomCode,
    {
      roomCode: roomCode,
      players: [{ name: hostName, host: true }],
      config: {
        ...req.body,
      },
      status: 'waiting',
    },
    {
      players: [{ uid: res.locals.user.uid }],
    }
  );

  return res.send({ roomCode });
});

async function resetRoom(
  roomCode: string,
  publicOverwrites?: any,
  secretOverwrites?: any
): Promise<any> {
  const roomRef = admin.database().ref('rooms/' + roomCode);
  let room: Room = (await roomRef.get()).val();

  const grid = [
    [
      [-1, -1, -1],
      [-1, -1, -1],
      [-1, -1, -1],
    ],
    [
      [-1, -1, -1],
      [-1, -1, -1],
      [-1, -1, -1],
    ],
    [
      [-1, -1, -1],
      [-1, -1, -1],
      [-1, -1, -1],
    ],
  ];

  room = {
    public: {
      config: room?.public?.config,
      players: room?.public?.players || [],
      timestamp: Date.now(),
      nextPlayerIdx: room?.public?.victor || 0,
      roomCode: room?.public?.roomCode,
      grid,
      victor: null,
      lastMove: 'reset',
      status: 'playing',
      ...publicOverwrites,
    },
    secret: {
      players: room?.secret?.players || [],
      ...secretOverwrites,
    },
  };

  roomRef.set(room);
}

/** joinRoom$ */
apiRouter.get('/rooms/:roomCode/join', async (req: Request, res: Response) => {
  if (!req.params?.roomCode) res.status(400).send('No room code supplied');

  const roomRef = admin.database().ref('rooms/' + req.params.roomCode);
  const room: Room = (await roomRef.get()).val();

  if (room) {
    const playerIdx = room.secret?.players?.findIndex(
      (p) => p.uid === res.locals.user?.uid
    );
    const inRoom = playerIdx !== undefined && playerIdx !== -1;

    const roomCode = room.public.roomCode;

    if (inRoom) {
      res.send({ roomCode, playerIdx });
    } else {
      if (room.public.status !== 'waiting') {
        // Joining a full room (make spectator)
        return res.send({ roomCode, playerIdx: -1 });
      }

      await roomRef
        .child('secret/players')
        .update([
          ...(room.secret ? room.secret.players : []),
          { uid: res.locals.user.uid },
        ]);

      let newPlayerName =
        (await admin.auth().getUser(res.locals.user.uid)).displayName ||
        'GUEST';

      /* Check if another player with same name is in room */
      if (room.public.players?.some((p) => p.name === newPlayerName)) {
        newPlayerName += '2';
      }

      const status =
        room.public?.players?.length === 3 - 1 ? 'playing' : 'waiting';

      const publicUpdate = {
        players: [
          // Add new player
          ...(room.public.players ? room.public.players : []),
          {
            name: newPlayerName.trim(),
          },
        ],
        status,
      };
      const _update = await roomRef.child('public').update(publicUpdate);

      return res.send({ playerIdx: publicUpdate.players.length - 1, roomCode });
    }
  } else {
    return res.status(400).send('Could not get room ' + req.params.roomCode);
  }
});

/** resetRoom$ */
apiRouter.get('/rooms/:roomCode/reset', async (req, res) => {
  if (!res.locals.user?.uid)
    return res.status(403).send('Must be authenticated to reset room');

  if (!req.params?.roomCode)
    return res.status(400).send('Room code is required');

  const roomRef = admin.database().ref('rooms/' + req.params.roomCode);

  if ((await roomRef.child('public/status').get()).val() !== 'over')
    return res.status(400).send("Can only reset a status:'over' room");

  if (
    (await roomRef.child('secret/players/0/uid').get()).val() !==
    res.locals.user.uid
  )
    return res.status(403).send('Only host may reset room');

  return res.send(resetRoom(req.params.roomCode));
});

/** makeMove$ */
apiRouter.post('/rooms/:roomCode/move', async (req, res) => {
  const roomRef = admin.database().ref('rooms/' + req.params.roomCode);
  const roomSnap = await roomRef.get();
  if (!roomSnap.exists()) {
    return res.status(400).send('Room does not exist');
  }

  const room: Room = await roomSnap.val();

  const playerIdx = room.secret?.players.findIndex(
    (p) => p.uid === res.locals.user?.uid
  );

  const nextPlayerIdx: number = room.public.nextPlayerIdx;

  if (nextPlayerIdx === playerIdx) {
    const grid: number[][][] = room.public.grid;

    // check bottom up (gravity) if space in column
    let y = -1;
    for (let yCheck = 0; yCheck < 3; yCheck++) {
      if (grid[req.body.x][yCheck][req.body.z] < 0) {
        // unoccupied
        y = yCheck;
        break;
      }
    }

    if (y === -1) {
      return res.status(400).send('Invalid move -- column is full');
    } else {
      const victory = checkVictory(playerIdx, grid, req.body.x, y, req.body.z);

      const roomUpdate: any = {};
      roomUpdate[`public/timestamp`] = Date.now();
      roomUpdate[`public/grid/${req.body.x}/${y}/${req.body.z}`] = nextPlayerIdx;
      roomUpdate[`public/lastMove`] = { x: req.body.x, y, z: req.body.z };
      roomUpdate['public/nextPlayerIdx'] = victory
        ? -1
        : nextPlayerIdx + 1 === 3
        ? 0
        : nextPlayerIdx + 1;
      roomUpdate['public/victor'] = victory ? playerIdx : null;
      if (victory) roomUpdate['public/status'] = 'over';

      await roomRef.update(roomUpdate);
    }
  } else {
    return res.status(403).send(`Not your turn, ${nextPlayerIdx}:${playerIdx}`);
  }
});

export default apiRouter;

function makeId(len = 3) {
  let result = '';
  const characters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const charactersLength = characters.length;
  for (let i = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function checkVictory(
  player: number,
  grid: number[][][],
  x: number,
  y: number,
  z: number
): boolean {
  const vectors: { x: number; y: number; z: number }[] = [];
  vectors.push({ x: 0, y: 0, z: 1 }); // 1D
  for (let _z = -1; _z <= 1; _z++) {
    // 2D
    vectors.push({ x: 1, y: 0, z: _z });
  }
  for (let _x = -1; _x <= 1; _x++) {
    // Top hemisphere
    for (let _z = -1; _z <= 1; _z++) {
      vectors.push({ x: _x, y: 1, z: _z });
    }
  }

  return vectors?.some((v) => {
    let counter = 1;

    countMatches(false);
    countMatches(true);

    return counter === grid.length;

    function countMatches(invert: boolean) {
      const m = invert ? -1 : 1;
      let cx = x + v.x * m;
      let cy = y + v.y * m;
      let cz = z + v.z * m;

      while (
        checkExists(grid.length, cx, cy, cz) &&
        grid[cx][cy][cz] === player
      ) {
        cx += v.x * m;
        cy += v.y * m;
        cz += v.z * m;
        counter++;
      }

      function checkExists(
        sideLen: number,
        _x: number,
        _y: number,
        _z: number
      ): boolean {
        return (
          _x >= 0 &&
          _x < sideLen &&
          _y >= 0 &&
          _y < sideLen &&
          _z >= 0 &&
          _z < sideLen
        );
      }
    }
  });
}