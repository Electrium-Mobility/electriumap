import { db } from '../db/firebase'; // Adjust the import path as necessary
import { collection, getDocs } from "firebase/firestore";


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
  }
}