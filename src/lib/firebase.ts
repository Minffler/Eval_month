'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dev-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "evalmax-dev.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "evalmax-dev",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "evalmax-dev.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "dev-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dev-app-id",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

if (process.env.NODE_ENV === 'development') {
  try {
    connectAuthEmulator(auth, 'http://localhost:6000');
    connectFirestoreEmulator(db, 'localhost', 9000);
    console.log("Connected to Firebase Emulators");
  } catch (error) {
    // This can happen with hot-reloading. If it's already connected, we don't need to worry.
    if (error instanceof Error && error.message.includes('already connected')) {
        // console.log("Emulators already connected.");
    } else {
        console.error("Error connecting to Firebase emulators:", error);
    }
  }
}

export { app, auth, db };
