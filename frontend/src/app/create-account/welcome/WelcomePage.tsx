"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; 
import Image from "next/image";

function WelcomePage(){
  const router = useRouter(); 

  return (
    <div className="bg-sign-in min-h-screen flex items-center justify-center ">
      <div className="absolute top-0 left-0 w-full flex flex-col items-center mt-[100px]">
            <Image src={"/images/electrium.png"} width={180} height={110} className="absolute top-[100px]" alt="Electrium logo" />
            <h1 className="text-6xl font-bold text-white m-0 absolute top-[180px]">Electriumap</h1> 
              {/* retrieve name from db */}
            <h1 className="text-6xl font-bold text-[#6AB657] mt-70">Welcome *Name*</h1>
            <h1 className="text-2xl font-bold text-[#FFFFF] mt-10">Find your next <span className="text-[#6AB657]">charge</span> |</h1>
      </div>

     
    </div>
  );
} 

export default WelcomePage; 
