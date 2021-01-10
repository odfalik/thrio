import { Room, RoomConfig } from '../../../interfaces';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase);

export const newRoom = functions.https.onCall(
  async (config: RoomConfig, context): Promise<string> => {
    const roomCode = makeId(4);
    if (!context.auth)
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Need auth to create a room'
      );
    const hostName = (await admin.auth().getUser(context.auth.uid)).displayName;

    return resetGame(
      roomCode,
      {
        roomCode: roomCode,
        players: [{ name: hostName, host: true }],
        config: {
          ...config,
        },
      },
      {
        players: [{ uid: context.auth.uid }],
      }
    ).then(() => {
      return roomCode;
    });
  }
);

async function resetGame(
  roomCode: string,
  publicOverwrites: any,
  secretOverwrites: any
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
      timestamp: Date.now(),
      nextPlayerIdx: room?.public?.victor || 0,
      grid,
      victor: null,
      ...publicOverwrites,
    },
    secret: {
      ...secretOverwrites,
    },
  };

  return roomRef.set(room);
}

export const joinRoom = functions.https.onCall(
  async (params: { roomCode?: string }, context) => {
    if (!params) params = {};

    if (!context.auth)
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Cannot join without auth'
      );

    if (!params?.roomCode) {
      const rooms: object = (
        await admin
          .database()
          .ref('rooms')
          .orderByChild('public/config/public')
          .equalTo(true)
          .get()
      ).val();

      const availableRooms: Room[] = Object.values(rooms);

      const availableRoom = availableRooms?.find(
        (room) => room.public.status === 'waiting'
      );
      if (!availableRoom)
        throw new functions.https.HttpsError(
          'not-found',
          'No available rooms found'
        );
      else {
        params.roomCode = availableRoom.public.roomCode;
      }
    }

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

      if (inRoom) {
        return { playerIdx };
      } else {
        /* Spectator */
        if (room.public.status !== 'waiting') {
          return { roomCode: room.public.roomCode, playerIdx: -1 };
        }

        await roomRef
          .child('secret/players')
          .update([
            ...(room.secret ? room.secret.players : []),
            { uid: context.auth.uid },
          ]);

        let newPlayerName =
          (await admin.auth().getUser(context.auth.uid)).displayName || 'Guest';
        /* Check if another player with same name is in room */
        if (room.public.players?.some((p) => p.name === newPlayerName)) {
          newPlayerName += '2';
        }

        const status =
          room.public?.players?.length === 3 ? 'playing' : 'waiting';

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
            return { playerIdx: publicUpdate.players.length - 1, roomCode: room.public.roomCode };
          });
      }
    } else {
      throw new functions.https.HttpsError(
        'unavailable',
        'Could not get room ' + params.roomCode
      );
    }
  }
);

export const getRooms = functions.https.onCall(async (params: any, context) => {
  const rooms: object = (
    await admin
      .database()
      .ref('rooms')
      .orderByChild('public/config/public')
      .equalTo(true)
      .get()
  ).val();

  const availableRooms: Room[] = Object.values(rooms);

  const availableRoomPublics = availableRooms
    .sort((a, b) => a.public.timestamp - b.public.timestamp)
    .slice(0, 5)
    .map((room: Room) => {
      return { ...room.public };
    });

  return availableRoomPublics;
});

export const makeMove = functions.https.onCall(
  async (params: { roomCode: string; x: number; z: number }, context) => {
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
        roomUpdate[`public/grid/${params.x}/${y}/${params.z}`] = nextPlayerIdx;
        roomUpdate['public/nextPlayerIdx'] = victory
          ? -1
          : nextPlayerIdx + 1 === 3
          ? 0
          : nextPlayerIdx + 1;
        roomUpdate['public/victor'] = victory ? playerIdx : null;

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
);

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

export const saveToken = functions.https.onCall(
  (params: { token: string }, context) => {
    return admin
      .database()
      .ref('users/' + context.auth?.uid + '/token')
      .set(params.token);
  }
);

function makeId(len = 3) {
  let result = '';
  const characters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const charactersLength = characters.length;
  for (let i = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const dailyJob = functions.https.onRequest((req, res) => {
  return admin
    .database()
    .ref('rooms')
    .orderByChild('public/timestamp')
    .endAt(Date.now() - 2 * 86400000) // Delete 2-day-old rooms
    .ref.remove()
    .then(() => {
      res.status(200).send('OK');
    });
});
