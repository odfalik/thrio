import { Player, Room } from "../../../interfaces";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp(functions.config().firebase);

async function resetGame(roomCode: string, overwrites: object): Promise<any> {
  const roomRef = admin.database().ref("rooms/" + roomCode);
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
    ...{
      nextPlayer: 0,
      time: Date.now(),
      grid,
      victor: null,
      players: room?.players || [],
    },
    ...overwrites,
  };

  return roomRef.update(room);
}

export const joinRoom = functions.https.onCall(async (params, context) => {
  const roomRef = await admin
    .database()
    .ref("rooms/" + params.roomCode)
  const room: Room = (await roomRef.get()).val();

  if (room) {
    const players: Player[] = room.players || [];

    const playerIdx = players?.findIndex((p) => p.name === params.name);
    const inRoom = playerIdx !== undefined && playerIdx !== -1;

    if (!inRoom && players.length === 3) {
      throw new functions.https.HttpsError("unavailable", "Room is full");
    }

    if (inRoom) {
      return playerIdx;
    } else {
      return await roomRef.update({
        players: [...players, { name: params.name }],
        isFull: players.length === 3, 
      });
    }
  } else {
    throw new functions.https.HttpsError(
      "unavailable",
      "Could not get room " + params.roomCode
    );
  }
});

export const newRoom = functions.https.onCall(
  (params, context): Promise<string> => {
    const roomCode = makeId(4);

    return resetGame(roomCode, {
      roomCode: roomCode,
      players: [{ name: params.name, host: true }],
    }).then(() => {
      return roomCode;
    });
  }
);

export const makeMove = functions.https.onCall(async (params, context) => {

  const roomRef = admin.database().ref("rooms/" + params.roomCode);
  const roomSnap = await roomRef.get();
  if (!roomSnap.exists()) {
    throw new functions.https.HttpsError("not-found", "Room does not exist");
  }

  const room: Room = await roomSnap.val();

  // const players: Player[] = room.players || [];
  const playerIdx = params.playerIdx;

  const nextPlayer: number = room.nextPlayer;

  if (nextPlayer === playerIdx) {
    const grid: number[][][] = room.grid;

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
        "invalid-argument",
        "Invalid move -- column is full"
      );
    } else {
      const victory = checkVictory(playerIdx, grid, params.x, y, params.z);

      const roomUpdate: any = {};
      roomUpdate[`grid/${params.x}/${y}/${params.z}`] = nextPlayer;
      roomUpdate["nextPlayer"] = victory ? -1 : (nextPlayer + 1 === 3 ? 0 : nextPlayer + 1);
      roomUpdate["victor"] = victory ? playerIdx : null;

      return await roomRef.update(roomUpdate);
    }
  } else {
    throw new functions.https.HttpsError("permission-denied", `Not your turn, ${nextPlayer}:${playerIdx}`);
  }
});

function checkVictory(
  player: number,
  grid: number[][][],
  x: number,
  y: number,
  z: number
): boolean {
  const vectors: { x: number; y: number; z: number }[] = [
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 1, z: 1 },
    { x: 1, y: 0, z: 0 },
    { x: 1, y: 0, z: 1 },
    { x: 1, y: 1, z: 0 },
    { x: 1, y: 1, z: 1 },
  ];

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

function makeId(len = 3) {
  let result = "";
  const characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const charactersLength = characters.length;
  for (let i = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
