import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/app/firebase/firebase";

const db = getFirestore(app);

export async function GET() {
  try {
    //temporarily using hardcoded auth (update later)
    const uid = "test123";

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json([]);
    }

    const userData = userSnap.data();
    const savedOutlets = userData.savedOutlets || [];

    if (savedOutlets.length === 0) {
      return NextResponse.json([]);
    }

    //fetch outlet details stored in outlets collection
    const outletRefs = await Promise.all(
      savedOutlets.map(async (outletId: string) => {
        const outletSnap = await getDoc(doc(db, "outlets", outletId));
        return outletSnap.exists()
          ? { id: outletSnap.id, ...outletSnap.data() }
          : null;
      })
    );

    const filteredOutlets = outletRefs.filter(Boolean);
    return NextResponse.json(filteredOutlets);
  } catch (error) {
    console.error("Error fetching saved outlets:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved outlets" },
      { status: 500 }
    );
  }
}
