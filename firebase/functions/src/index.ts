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

export const newRoom = functions.https.onCall((params, context) => {
  return new Promise((resolve, reject) => {
    const roomCode = makeId(4)

    const ref = admin
      .database()
      .ref('rooms/' + roomCode)
      .set({
        roomCode: roomCode,
        nextPlayer: 0,
        time: Date.now(),
      });

    ref.then((data) => {
      resolve(roomCode)
    }).catch(reject);
  });
});

export const makeMove = functions.https.onCall((params, context) => {
    
    const roomRef = admin.database().ref('rooms/' + params.roomCode);

    return roomRef.child('nextPlayer').get().then((nextPlayerRef) => {
      const nextPlayer: number = nextPlayerRef.val();
      if (nextPlayer === params.player) {
        return roomRef.child('grid').set([[1,2,3],[23,24,25]])
      } else {
        return { error: `Not your turn. nextPlayer:${nextPlayer}`};
      }
    });
});
