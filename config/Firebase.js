// Import the functions you need from the SDKs you need
import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {initializeFirestore} from 'firebase/firestore';
import {getStorage} from 'firebase/storage';
import {getFunctions} from 'firebase/functions';
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwgQ60yFo5w2nKGuloAhLp7yCfX4KolsA",
  authDomain: "bikelyich.firebaseapp.com",
  projectId: "bikelyich",
  storageBucket: "bikelyich.appspot.com",
  messagingSenderId: "625628627020",
  appId: "1:625628627020:web:bf6761af19040c84f0b4e9",
  measurementId: "G-XLTPBQM3YQ"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);
export const functions = getFunctions(app);
//bikely3:
// apiKey: "AIzaSyDhsI9QP7HC7Tgkgae9STLB-u8XCJ7zi1k",
//   authDomain: "bikely3-999bd.firebaseapp.com",
//   projectId: "bikely3-999bd",
//   storageBucket: "bikely3-999bd.appspot.com",
//   messagingSenderId: "696115043921",
//   appId: "1:696115043921:web:8a702e276d3d324626e270",
//   measurementId: "G-D25B34C197"
