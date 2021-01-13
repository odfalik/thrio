import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(require('../serviceaccount.json')),
  databaseURL: 'https://thrio-d87c1-default-rtdb.firebaseio.com',
  projectId: 'thrio-d87c1',
  storageBucket: 'thrio-d87c1.appspot.com',
});

export default admin;
