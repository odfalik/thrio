// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/8.2.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.2.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.

firebase.initializeApp({
  apiKey: 'AIzaSyCwIVPOH_-HkveN0bRgvPXvi6zazGj2WWM',
  authDomain: 'thrio-d87c1.firebaseapp.com',
  databaseURL: 'https://thrio-d87c1-default-rtdb.firebaseio.com',
  projectId: 'thrio-d87c1',
  storageBucket: 'thrio-d87c1.appspot.com',
  messagingSenderId: '712157473899',
  appId: '1:712157473899:web:8aa699f65f1778422f552e',
  measurementId: 'G-X4PYQQQ2XZ'
});



// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();
