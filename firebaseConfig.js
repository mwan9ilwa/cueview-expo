import { initializeApp } from 'firebase/app';

// Optionally import the services that you want to use
// import {...} from 'firebase/auth';
// import {...} from 'firebase/database';
// import {...} from 'firebase/firestore';
// import {...} from 'firebase/functions';
// import {...} from 'firebase/storage';

// Initialize Firebase
const firebaseConfig = {
  databaseURL: 'https://project-id.firebaseio.com',
  apiKey: "AIzaSyBeJQd4Ty-gkyOCjQkPFOGtmqF0lLUKTHE",
  authDomain: "cue-view.firebaseapp.com",
  projectId: "cue-view",
  storageBucket: "cue-view.firebasestorage.app",
  messagingSenderId: "244545040424",
  appId: "1:244545040424:web:db8c068d800da869f9851d",
  measurementId: "G-C1DFG5F68V"
};

const app = initializeApp(firebaseConfig);
// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
