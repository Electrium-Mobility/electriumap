import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../frontend/src/app/db/firebase";

//interface for data describing an outlet
interface Outlet {
  latitude: number;
  longitude: number;
  userName: string; 
  userId: string;
}

//function to add outlate to database
export async function addOutlet(outlet: Outlet) {
  try {
    //add outlet data with timestamp
    const docRef = await addDoc(collection(db, "Outlets"), {
      ...outlet,
      "Created at": serverTimestamp()  
    });
    //log document id
    console.log("Outlet added to database with ID: ", docRef.id);
  } catch (e) {
    //log errors
    console.error("Error adding outlet to database: ", e);
  }
}