"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; 
import Image from "next/image";
import { setGlobalFirstName } from "../../globals";

function ProfilePage(){
  const [profileData, setProfileData] = useState({
    FirstName: "",
    LastName: "",
  });
  const [errorMsg, setErrorMsg] = useState(''); 
  const router = useRouter(); 

  // update user's input via 'value'
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileData.FirstName || !profileData.LastName ){ 
      setErrorMsg("First and last name are required. Please try again.");
      return;  
    }

    // set global first name variable 
    setGlobalFirstName(profileData.FirstName); 

    router.push("/create-account/vehicle");
  };

  return (
    <div className="bg-sign-in min-h-screen flex items-center justify-center ">

      <div className="absolute top-0 left-0 w-full flex flex-col items-center">
          <Image src={"/images/electrium.png"} width={160} height={110} className="absolute top-[80px]" alt="Electrium logo" />
          <h1 className="text-2xl font-bold text-[#6AB657] m-0 absolute top-[160px]">Add your personal details</h1>
          <Image src={"/images/default_profile.png"} width={150} height={150} className="absolute top-[210px] " alt="Electrium logo" />   
      </div>

      <form onSubmit={handleSubmit} className="mt-5">
        <input
          type="FirstName"
          name="FirstName"
          placeholder="First Name"
          value={profileData.FirstName}
          onChange={handleChange}
          className="w-full mt-75 p-2 rounded-xl bg-[#7676804D] text-white border-2 focus:outline-none focus:border-[#6AB657] border-transparent"
        />

        <input
          type="LastName"
          name="LastName"
          placeholder="Last Name"
          value={profileData.LastName}
          onChange={handleChange}
          className="w-full mt-5 p-2 rounded-xl bg-[#7676804D] text-white border-2 focus:outline-none focus:border-[#6AB657] border-transparent"
        />

        {/* error message */}
        {errorMsg && ( <p className='text-red-500 text-sm mt-2'>{errorMsg}</p>)}

        <div className="flex justify-between items-center mt-5"> 
          {/* back button */}
          <button
            type="button"
            className="mt-3 bg-[#6AB657] text-white w-12 h-12 rounded-full rounded-3xl flex items-center justify-center align-right"
            onClick={() => router.back()}
          >
            <svg className="w-6 h-6 text-[#457D2E] dark:text-[#457D2E]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5H1m0 0l4 4M1 5l4-4"/>
            </svg>
          </button>

          {/* continue button */}
          <button
            type="submit"
            className="mt-3 bg-[#6AB657] text-white w-12 h-12 rounded-full rounded-3xl flex items-center justify-center align-right"
          >
            <svg className="w-6 h-6 text-[#457D2E] dark:text-[#457D2E]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
          </button>
        </div>

      </form>

      {/* green bar status */}
      <div className="absolute bottom-0 left-0 w-full">
        <div className="bg-[#6AB657] h-2.5 w-2/4"></div>
      </div>

    </div>
  );
} 

export default ProfilePage; 
