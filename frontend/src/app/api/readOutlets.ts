import { db } from "../firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export const readOutlets = async () => {
  try {
    // Get a reference to the "Outlets" collection
    const outletsCollection = collection(db, "Outlets");
    
    // Fetch all documents in the collection
    const querySnapshot = await getDocs(outletsCollection);
    
    // Map through the documents and return their data
    const outlets = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return outlets;
  } catch (error) {
    console.error("Error reading outlets from database: ", error);
    return [];
  }
}

export const readOutletsByBounds = async ({ swLat, swLng, neLat, neLng }: {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}) => {
  try {
    const outletsCollection = collection(db, "Outlets");
    const querySnapshot = await getDocs(outletsCollection); //fetch all outlets and filter by bounds
    
    const outlets = querySnapshot.docs
    //map each doc to an object with id and doc.data fields
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      //filter outlets within bounds
      .filter((outlet: any) => {
        const lat = outlet.latitude;
        const lng = outlet.longitude;
        
        //check if outlet's latitude is within the bounds (sw < ne)
        const withinLat = lat >= swLat && lat <= neLat;
        
        //check longitude bounds
        let withinLng;
        if (swLng <= neLng) { //normal case: between swLng and neLng
          withinLng = lng >= swLng && lng <= neLng;
        }
        
        else {
          withinLng = lng >= swLng || lng <= neLng; //bounds span the date line (ex: swLng = 150, neLng = -150)
        }
        
        return withinLat && withinLng; //return true (keep outlet) if both lat and lng are within bounds
      });
    
    return outlets; //return outlets in viewport
  } 
  catch (error) {
    console.error("Error reading outlets by bounds from database: ", error);
    return []; //empty array
  }
}