import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDOg7aqcR1irdUw58I8G4yJ4TMC9c600Ms",
  authDomain: "ai-career-copilot-fbe05.firebaseapp.com",
  projectId: "ai-career-copilot-fbe05",
  storageBucket: "ai-career-copilot-fbe05.firebasestorage.app",
  messagingSenderId: "43134172320",
  appId: "1:43134172320:web:96173a158c9274cc1b1dc5",
  measurementId: "G-Q40QSK9B6R"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);