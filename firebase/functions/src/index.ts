import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase);

function makeId(len = 3) {
  let result = '';
  const characters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const charactersLength = characters.length;
  for (let i = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function verifyRoom(roomCode: string): Promise<boolean> {
  return admin.database().ref('rooms/' + roomCode).once('value').then(snapshot => {
    return snapshot.exists();
  });
}

async function resetGame(roomCode: string): Promise<any> {
  const verified = await verifyRoom(roomCode);
  if (verified) {

    const grid = [ 
      [ [-1, -1, -1], [-1, -1, -1], [-1, -1, -1] ],
      [ [-1, -1, -1], [-1, -1, -1], [-1, -1, -1] ],
      [ [-1, -1, -1], [-1, -1, -1], [-1, -1, -1] ],
    ];

    const roomRef = await admin.database().ref('rooms/' + roomCode);
    return roomRef.update({
      nextPlayer: 0,
      time: Date.now(),
      grid,
      victor: null,
    });

  } else {
    return Promise.resolve({ error: 'Room does not exist' });
  }
}

export const joinRoom = functions.https.onCall(async (params, context) => {
  const verified = await verifyRoom(params.roomCode);
  if (verified) {
    const playersRef = admin.database().ref('rooms/' + params.roomCode + '/players');
    const playerSnapshot = await playersRef.get();
    const players: { name: string }[] = playerSnapshot.val() || [];

    if (!players || !Array.isArray(players) || (players.length === 3 && !players.some(p => p.name === params.name) )) {  // full room
      return { error: 'Room is full' };
    } else if (players.some(player => player.name === params.name)) {        // already in room
      return 'success';
    } else {
      return playersRef.set([...players, { name: params.name }]).then(() => 'success');
    }
    
  } else {
    return { error: 'Could not get room ' + params.roomCode };
  }
});

export const newRoom = functions.https.onCall((params, context): Promise<string> => {
  const roomCode = makeId(4)

  return admin
    .database()
    .ref('rooms/' + roomCode)
    .update({
      roomCode: roomCode,
      time: Date.now(),
      players: [{ name: params.name, host: true }],
    }).then(() => {
      return resetGame(roomCode).then(() => { return roomCode; });
    });
});



export const makeMove = functions.https.onCall(async (params, context) => {

  const roomRef = admin.database().ref('rooms/' + params.roomCode);
  const players: any[] = await (await roomRef.child('players').get()).val();
  const playerIdx = players.findIndex(p => p.name === params.name);

  const nextPlayerRef = await roomRef.child('nextPlayer').get();
  const nextPlayer: number = nextPlayerRef.val();

  if (nextPlayer === playerIdx) {
    const grid: number[][][] = (await roomRef.child('grid').get()).val();
    
    let y = -1;
    for (let yCheck = 0; yCheck < 3; yCheck++) {  // check bottom up (gravity)
      if (grid[params.x][yCheck][params.z] < 0) { // unoccupied
        y = yCheck;
        break;
      }
    }

    if (y === -1) {
      return { error: 'invalid move' };
    } else {

      const victory = checkVictory(playerIdx, grid, params.x, y, params.z)

      return roomRef.child(`grid/${params.x}/${y}/${params.z}`).set(nextPlayer)
        .then(async () => {
          return await roomRef.update({
            nextPlayer: nextPlayer+1 === 3 ? 0 : nextPlayer + 1,
            victor: victory ? playerIdx : null,
          });
        });
    }

  } else {
    return { error: `Not your turn. nextPlayer:${nextPlayer}`};
  }

});

function checkVictory(player: number, grid: number[][][], x: number, y: number, z: number): boolean {
  
  const vectors: {x: number, y: number, z: number}[] = [];

  // Calculate possible victory vectors
  for (let xOffset = 0; xOffset <= 1; xOffset++) {
    for (let yOffset = 0; yOffset <= 1; yOffset++) {
      for (let zOffset = 0; zOffset <= 1; zOffset++) {
        if (!(xOffset === 0 && yOffset === 0 && zOffset === 0) && checkExists(grid.length, x + xOffset, y + yOffset, z + zOffset)) {
          vectors.push({
            x: xOffset,
            y: yOffset,
            z: zOffset,
          });
        }
      }
    }
  }

  return vectors?.some(v => {
    let counter = 1;
    let cx = x + v.x;
    let cy = y + v.y;
    let cz = z + v.z;

    while (grid[cx][cy][cz] === player) {
      cx += v.x;
      cy += v.y;
      cz += v.z;
      counter++;
    }

    return counter === grid.length;
  });

  function checkExists(sideLen: number, x: number, y: number, z: number): boolean {
    return x >= 0 && x < 3 && y >= 0 && y < 3 && z >= 0 && z < 3;
  }
}