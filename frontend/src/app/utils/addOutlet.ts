import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";

//interface for data describing an outlet
interface Outlet {
  latitude: number;
  longitude: number;
  userName: string; 
  userId: string;
  locationName: string;     
  chargerType: string;      
  description: string; 
}

//function to add outlate to database
export async function addOutlet(outlet: Outlet) {
  try {
    //add outlet data with timestamp
    const docRef = await addDoc(collection(db, "Outlets"), {
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      userName: outlet.userName,
      userId: outlet.userId,
      locationName: outlet.locationName,
      chargerType: outlet.chargerType,
      description: outlet.description,
      createdAt: serverTimestamp() 
    });
    //log document id
    console.log("Outlet added to database with ID: ", docRef.id);
  } catch (e) {
    //log errorss
    console.error("Error adding outlet to database: ", e);
  }
}
