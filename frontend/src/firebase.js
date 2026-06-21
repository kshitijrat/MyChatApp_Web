import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAO75kyPcjn88PXSkiFPVIQxkeMJbC3a70",
  authDomain: "mychatapp-1c9a5.firebaseapp.com",
  databaseURL: "https://mychatapp-1c9a5-default-rtdb.firebaseio.com",
  projectId: "mychatapp-1c9a5",
  storageBucket: "mychatapp-1c9a5.appspot.com",
  messagingSenderId: "778996421269",
  appId: "1:778996421269:web:5ea3f2b13f463ebc8a819c",
  measurementId: "G-M5NFKLK0X4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

export default app;