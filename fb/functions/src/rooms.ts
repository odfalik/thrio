import { Player, Room, RoomConfig, RoomPublic } from '../../../interfaces';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const app = admin.initializeApp(functions.config().firebase);

export async function newRoom(
  config: RoomConfig,
  context: functions.https.CallableContext
): Promise<string> {
  const roomCode = makeId(4);
  if (!context.auth)
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Need auth to create a room'
    );
  const hostName = (await admin.auth().getUser(context.auth.uid)).displayName;

  const botPlayers: Player[] = [];
  const botSecretPlayers = [];
  for (let i = 1; i <= (config?.bots || 0); i++) {
    botPlayers.push({ name: 'Bot ' + i, bot: true });
    botSecretPlayers.push({ uid: 'bot' });
  }

  return resetGame(
    roomCode,
    {
      roomCode: roomCode,
      players: [{ name: hostName, host: true }, ...botPlayers],
      config: {
        ...config,
      },
      status:
        config.bots && config.players === config?.bots + 1
          ? 'playing'
          : 'waiting',
    },
    {
      players: [{ uid: context.auth.uid }, ...botSecretPlayers],
    }
  ).then(() => {
    return roomCode;
  });
}

export async function resetGame(
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

  return roomRef.set(room);
}

export async function resetRoom(
  params: { roomCode: string },
  context?: functions.https.CallableContext
): Promise<void> {
  if (!context?.auth?.uid)
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to reset room'
    );

  if (!params?.roomCode)
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Room code is required'
    );

  const roomRef = admin.database().ref('rooms/' + params.roomCode);

  if ((await roomRef.child('public/status').get()).val() !== 'over')
    throw new functions.https.HttpsError(
      'failed-precondition',
      "Can only reset a status:'over' room"
    );

  if (
    (await roomRef.child('secret/players/0/uid').get()).val() !==
    context.auth.uid
  )
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only host may reset room'
    );

  return resetGame(params.roomCode);
}

export async function joinRoom(
  params: { roomCode: string },
  context: functions.https.CallableContext
) {
  if (!context.auth)
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Cannot join without auth'
    );

  if (!params?.roomCode)
    throw new functions.https.HttpsError(
      'invalid-argument',
      'No room code supplied'
    );

  const roomRef = admin.database().ref('rooms/' + params.roomCode);
  const room: Room = (await roomRef.get()).val();

  if (room) {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'User does not exist'
      );
    }

    const playerIdx = room.secret?.players?.findIndex(
      (p) => p.uid === context.auth?.uid
    );
    const inRoom = playerIdx !== undefined && playerIdx !== -1;

    const roomCode = room.public.roomCode;

    if (inRoom) {
      return { roomCode, playerIdx };
    } else {
      if (room.public.status !== 'waiting') {
        // Joining a full room (make spectator)
        return { roomCode, playerIdx: -1 };
      }

      await roomRef
        .child('secret/players')
        .update([
          ...(room.secret ? room.secret.players : []),
          { uid: context.auth.uid },
        ]);

      let newPlayerName =
        (await admin.auth().getUser(context.auth.uid)).displayName || 'GUEST';

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

      return roomRef
        .child('public')
        .update(publicUpdate)
        .then(() => {
          return { playerIdx: publicUpdate.players.length - 1, roomCode };
        });
    }
  } else {
    throw new functions.https.HttpsError(
      'unavailable',
      'Could not get room ' + params.roomCode
    );
  }
}

export async function getRooms() {
  const rooms: Room[] = Object.values(
    (
      await admin
        .database()
        .ref('rooms')
        .orderByChild('public/status')
        .equalTo('waiting')
        .get()
    ).val() || {}
  );

  const availableRoomPublics: RoomPublic[] = rooms
    ? rooms
        .filter((r) => r.public)
        .sort((a, b) => b.public.timestamp - a.public.timestamp)
        .slice(0, 15)
        .map((room: any) => {
          room.public['hostName'] = room.public.players?.find(
            (p: any) => p.host
          ).name;
          return room.public;
        })
    : [];

  return availableRoomPublics;
}

export async function makeMove(
  params: { roomCode: string; x: number; z: number },
  context: functions.https.CallableContext
) {
  const roomRef = admin.database().ref('rooms/' + params.roomCode);
  const roomSnap = await roomRef.get();
  if (!roomSnap.exists()) {
    throw new functions.https.HttpsError('not-found', 'Room does not exist');
  }

  const room: Room = await roomSnap.val();

  const playerIdx = room.secret?.players.findIndex(
    (p) => p.uid === context.auth?.uid
  );

  const nextPlayerIdx: number = room.public.nextPlayerIdx;

  if (nextPlayerIdx === playerIdx) {
    const grid: number[][][] = room.public.grid;

    // check bottom up (gravity) if space in column
    let y = -1;
    for (let yCheck = 0; yCheck < 3; yCheck++) {
      if (grid[params.x][yCheck][params.z] < 0) {
        // unoccupied
        y = yCheck;
        break;
      }
    }

    if (y === -1) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid move -- column is full'
      );
    } else {
      const victory = checkVictory(playerIdx, grid, params.x, y, params.z);

      const roomUpdate: any = {};
      roomUpdate[`public/timestamp`] = Date.now();
      roomUpdate[`public/grid/${params.x}/${y}/${params.z}`] = nextPlayerIdx;
      roomUpdate[`public/lastMove`] = { x: params.x, y, z: params.z };
      roomUpdate['public/nextPlayerIdx'] = victory
        ? -1
        : nextPlayerIdx + 1 === 3
        ? 0
        : nextPlayerIdx + 1;
      roomUpdate['public/victor'] = victory ? playerIdx : null;
      if (victory) roomUpdate['public/status'] = 'over';

      await roomRef.update(roomUpdate);

      /* Notify next player it's their turn */
      /* const nextPlayerUid = room.secret?.players[nextPlayerIdx]?.uid;
        if (nextPlayerUid) {
          const nextPlayerToken = (
            await admin
              .database()
              .ref('users/' + nextPlayerUid + '/token')
              .get()
          ).val();
          if (nextPlayerToken && nextPlayerToken !== 'declined') {
            admin.messaging().sendToDevice(nextPlayerToken, {
              notification: {
                title: `It's your turn`,
                body: `The other players in ${room.public.roomCode} are waiting on you`,
              },
            });
          }
        } */
    }
  } else {
    throw new functions.https.HttpsError(
      'permission-denied',
      `Not your turn, ${nextPlayerIdx}:${playerIdx}`
    );
  }
}

export function dailyJob(req: any, res: any) {
  return admin
    .database()
    .ref('rooms')
    .orderByChild('public/timestamp')
    .endAt(Date.now() - 2 * 86400000) // Delete 2-day-old rooms
    .ref.remove()
    .then(() => {
      res.status(200).send('OK');
    });
}

export function checkVictory(
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

export function makeId(len = 3) {
  let result = '';
  const characters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const charactersLength = characters.length;
  for (let i = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
