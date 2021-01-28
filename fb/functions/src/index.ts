import * as functions from 'firebase-functions';
import * as rooms from './rooms';

export const newRoom = functions.https.onCall(rooms.newRoom);

export const resetRoom = functions.https.onCall(rooms.resetRoom);

export const joinRoom = functions.https.onCall(rooms.joinRoom);

export const getRooms = functions.https.onCall(rooms.getRooms);

export const makeMove = functions.runWith({
    timeoutSeconds: 300,
    memory: '1GB'
}).https.onCall(rooms.makeMove);

export const dailyJob = functions.https.onRequest(rooms.dailyJob);
