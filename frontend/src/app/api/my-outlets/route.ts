import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { app } from "@/app/firebase/firebase";

const db = getFirestore(app);

export async function GET() {
  try {
    //temporarily using hardcoded auth check for testing
    //to verify Firebase ID token here (update later)
    const uid = "test123";

    //query for outlets created by specific uid
    const q = query(collection(db, "Outlets"), where("userid", "==", uid));
    const querySnapshot = await getDocs(q);

    const outlets = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(outlets);
  } catch (error) {
    console.error("Error fetching user outlets:", error);
    return NextResponse.json(
      { error: "Failed to fetch outlets" },
      { status: 500 }
    );
  }
}
