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
      userid: outlet.userId,
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
interface FrontendOutletInput {
  locationName: string;
  chargerType: string;
  description: string;
  userName: string;
  userId: string;
}

// Geocoding helper
async function getLatLngFromAddress(address: string): Promise<{ lat: number; lng: number }> {
  const encoded = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data || data.length === 0) {
    throw new Error("Unable to geocode address.");
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}

// Frontend wrapper function
export async function addOutletFrontend(input: FrontendOutletInput): Promise<void> {
  try {
    const { lat, lng } = await getLatLngFromAddress(input.locationName);

    await addOutlet({
      latitude: lat,
      longitude: lng,
      userName: input.userName,
      userId: input.userId,
      locationName: input.locationName,
      chargerType: input.chargerType,
      description: input.description,
    });
  } catch (error) {
    console.error("Failed to add outlet from frontend:", error);
    throw error;
  }
}