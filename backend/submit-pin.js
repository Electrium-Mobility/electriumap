// Backend API endpoint for pin submission
// Accepts POST requests with pin data (latitude, longitude, and other fields)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const {
    latitude,
    longitude,
    address,
    numberOfOutlets,
    powerType,
    portType,
    condition,
    extraDetails,
    imageUrl,
  } = req.body;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    res.status(400).json({ error: "Invalid latitude or longitude" });
    return;
  }

  try {
    const docRef = await addDoc(collection(db, "Outlets"), {
      latitude,
      longitude,
      address: address || null,
      numberOfOutlets: numberOfOutlets || null,
      powerType: powerType || null,
      portType: portType || null,
      condition: condition || null,
      extraDetails: extraDetails || null,
      imageUrl: imageUrl || null,
      createdAt: serverTimestamp(),
    });
    res.status(200).json({ success: true, id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
