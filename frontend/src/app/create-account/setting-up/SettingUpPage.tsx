"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation"; 
import Image from "next/image";

function SettingUpPage(){
const router = useRouter();

  // 500ms delay before rendering welcome page 
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/create-account/welcome");
    }, 500);  

    return () => clearTimeout(timer); // cleanup
  }, [router]);

  return (
    <div className="bg-sign-in min-h-screen flex items-center justify-center ">

      <div className="absolute top-0 left-0 w-full flex flex-col items-center mt-[100px]">
          <Image src={"/images/electrium.png"} width={160} height={110} className="absolute top-[100px]" alt="Electrium logo" />
          <h1 className="text-2xl font-bold text-[#6AB657] mt-45">Setting up your profile...</h1>
      </div>

     
      {/* green bar status */}
      <div className="absolute bottom-0 left-0 w-full">
        <div className="bg-[#6AB657] h-2.5 w-full"></div>
      </div>

    </div>
  );
} 

export default SettingUpPage; 
