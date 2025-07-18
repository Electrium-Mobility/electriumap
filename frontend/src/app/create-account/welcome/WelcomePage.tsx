"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation"; 
import Image from "next/image";
import { useUserData } from "../../create-account/UserDataContext";


function WelcomePage(){
  const router = useRouter();
  const { userData } = useUserData();
  const firstName = userData.firstName.charAt(0).toUpperCase() + userData.firstName.slice(1).toLowerCase();

    // 1.5s delay 
    useEffect(() => {
      const timer = setTimeout(() => {
        router.push("/"); // render map component
      }, 1500);  
  
      return () => clearTimeout(timer); // cleanup
    }, [router]);
  

  return (
    <div className="bg-sign-in min-h-screen flex items-center justify-center ">
      <div className="absolute top-0 left-0 w-full flex flex-col items-center mt-[100px]">
            <Image src={"/images/electrium.png"} width={180} height={110} className="absolute top-[100px]" alt="Electrium logo" />
            <h1 className="text-6xl font-bold text-white m-0 absolute top-[180px]">Electriumap</h1> 
              {/* retrieve name from db */}
            <h1 className="text-6xl font-bold text-[#6AB657] mt-70">Welcome {firstName || "User"}</h1>
            <h1 className="text-2xl font-bold text-[#FFFFF] mt-10">Find your next <span className="text-[#6AB657]">charge</span> |</h1>
      </div>

     
    </div>
  );
} 

export default WelcomePage;
