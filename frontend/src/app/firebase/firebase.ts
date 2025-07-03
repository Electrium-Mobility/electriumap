import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

//Firebase config info including keys and ids
const firebaseConfig = {
  apiKey: "AIzaSyApxNuehMUOxEDybG45Eymv8er6bqCB6mQ",
  authDomain: "electriumap.firebaseapp.com",
  projectId: "electriumap",
  storageBucket: "electriumap.firebasestorage.app",
  messagingSenderId: "369697728783",
  appId: "1:369697728783:web:2e4be6df906e1f66c2f67a",
  measurementId: "G-FSV8JQKCLN"
};

//initialize firebase
const app = initializeApp(firebaseConfig);

//initialize firestore db
const db = getFirestore(app);

export { db };
