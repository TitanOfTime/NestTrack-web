import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCo8nJaoPIqs971kTDW_twLJL1kH9pv5WU",
  authDomain: "nesttrack-935ef.firebaseapp.com",
  projectId: "nesttrack-935ef",
  storageBucket: "nesttrack-935ef.firebasestorage.app",
  messagingSenderId: "1021354177769",
  appId: "1:1021354177769:web:e00e6d2e727da5365e2c78"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };