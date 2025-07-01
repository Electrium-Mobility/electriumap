"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; 
import Image from "next/image";
import Link from 'next/link';

function VehiclePage(){
  const [VehicleData, setVehicleData] = useState({
    Title: "",
    Type: "",
  });
  const [errorMsg, setErrorMsg] = useState(''); 
  const router = useRouter(); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVehicleData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/create-account/setting-up");
  };

  return (
    <div className="bg-sign-in min-h-screen flex items-center justify-center ">

      <div className="absolute top-0 left-0 w-full flex flex-col items-center">
          <Image src={"/images/electrium.png"} width={160} height={110} className="absolute top-[100px]" alt="Electrium logo" />
          <h1 className="text-2xl font-bold text-[#6AB657] m-0 absolute top-[180px]">Add your vehicle (optional)</h1>
      </div>

      <form onSubmit={handleSubmit} className="mt-5">
        <input
          type="text"
          name="Title"
          placeholder="Title"
          value={VehicleData.Title}
          onChange={handleChange}
          className="w-full mt-20 p-2 rounded-xl bg-[#7676804D] text-white border-2 focus:outline-none focus:border-[#6AB657] border-transparent"
        />

        <input
          type="text"
          name="Type"
          placeholder="Type"
          value={VehicleData.Type}
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
          
          {/* add vehicle button */}
          <button
            type="submit"
            className="mt-3 bg-[#6AB657] text-white w-12 h-12 rounded-full rounded-3xl flex items-center justify-center align-right"
          >
            <svg className="w-6 h-6 text-[#457D2E] dark:text-[#457D2E]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
          </button>
        </div>

        <div className="flex justify-end mt-5 mr-2"> 
          <p className="font-semibold" style={{color:'#2E7D32'}}>
              <Link href="/create-account/setting-up">Skip</Link> 
          </p>
        </div>
      </form>
    
        {/* green bar status */}
      <div className="absolute bottom-0 left-0 w-full">
        <div className="bg-[#6AB657] h-2.5 w-3/4"></div>
      </div>

    </div>
  );
} 

export default VehiclePage; 
