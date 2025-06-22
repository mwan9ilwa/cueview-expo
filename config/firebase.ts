import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBeJQd4Ty-gkyOCjQkPFOGtmqF0lLUKTHE",
  authDomain: "cue-view.firebaseapp.com",
  projectId: "cue-view",
  storageBucket: "cue-view.firebasestorage.app",
  messagingSenderId: "244545040424",
  appId: "1:244545040424:web:db8c068d800da869f9851d",
  measurementId: "G-C1DFG5F68V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication 
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
