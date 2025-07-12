import { addGeoOutlet, type Outlet } from "./geoFirestore";

//function to add outlet to database with spatial indexing
export async function addOutlet(outlet: Outlet) {
  try {
    //use GeoFirestore to add outlet with spatial indexing
    const docId = await addGeoOutlet(outlet);
    console.log("Outlet added to database with spatial indexing, ID: ", docId);
    return docId;
  } catch (e) {
    console.error("Error adding outlet to database: ", e);
    throw e;
  }
}
