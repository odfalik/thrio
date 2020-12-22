import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase);

function makeId(len = 3) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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
    const players: string[] = playerSnapshot.val() || [];

    if (!players || !Array.isArray(players) || players.length === 3) {  // full room
      return { error: 'Room is full' };
    } else if (players.some(player => player === params.name)) {        // already in room
      return;
    } else {
      return playersRef.set([...players, params.name]);
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
    }).then(() => {
      return resetGame(roomCode).then(() => { return roomCode; });
    });
});



export const makeMove = functions.https.onCall(async (params, context) => {

  const roomRef = admin.database().ref('rooms/' + params.roomCode);
  const players: any[] = await (await roomRef.child('players').get()).val();

  const nextPlayerRef = await roomRef.child('nextPlayer').get();
  const nextPlayer: number = nextPlayerRef.val();
  if (players[nextPlayer] === params.player) {
    return roomRef.child(`grid/${params.x}/${params.y}/${params.z}`).set(nextPlayer);
  } else {
    return { error: `Not your turn. nextPlayer:${nextPlayer}`};
  }

});
