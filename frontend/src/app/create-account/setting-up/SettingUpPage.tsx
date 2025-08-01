"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation"; 
import Image from "next/image";
import { auth } from "../../firebase/firebase";
import { db } from "../../firebase/firebase";
import { doc, setDoc, collection } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useUserData } from "../../create-account/UserDataContext";
import { setIsAuthenticated } from '../../globals';

function SettingUpPage(){
  const router = useRouter();
  const { userData, setUserData } = useUserData();

  // 2s delay before rendering welcome page 
  useEffect(() => {
    const timer = setTimeout(() => {
      const createAccount = async () => {
        try {
          // Create user with email and password
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            userData.email,
            userData.password
          );
          const user = userCredential.user;

          // Auto-capitalize first and last name
          const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

          // Save user info to Firestore under "Users" collection, using uid as document ID
          await setDoc(doc(db, "Users", user.uid), {
            firstName: capitalize(userData.firstName),
            lastName: capitalize(userData.lastName),
            email: user.email,
          });

          // Save vehicle data as a subcollection under the "Users" document
          if (userData.vehicle) {
            const vehicleDocRef = doc(collection(db, "Users", user.uid, "Vehicles")); // Auto-generate document ID
            await setDoc(vehicleDocRef, {
              title: userData.vehicle.title, // Assuming userData.vehicle contains a title field
              type: userData.vehicle.type,   // Assuming userData.vehicle contains a type field
            });
          }

          console.log("Account and profile created!");
          router.push("/create-account/welcome");
          setIsAuthenticated(true); // update global authenticated variable to enable future conditional UI behaviours
          console.log("isAuthenticated set to true");
        } catch (err) {
          console.error(err);
          // You can add error handling state here to show messages in UI if needed
        }
      };

      createAccount();
    }, 2000);  

    return () => clearTimeout(timer); // cleanup
  }, [userData, router]);

  return (
    <div className="bg-sign-in min-h-screen flex items-center justify-center">

      <div className="absolute top-0 left-0 w-full flex flex-col items-center mt-[120px]">
          <Image src={"/images/electrium.png"} width={160} height={110} className="absolute top-[120px]" alt="Electrium logo" />
          <h1 className="text-2xl font-bold text-[#6AB657] mt-50">Setting up your profile...</h1>
      </div>
     
      {/* green bar status */}
      <div className="absolute bottom-0 left-0 w-full">
        <div className="bg-[#6AB657] h-2.5 w-full"></div>
      </div>

    </div>
  );
} 

export default SettingUpPage;
