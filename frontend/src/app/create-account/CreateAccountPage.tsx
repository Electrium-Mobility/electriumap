"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; 
import Image from "next/image";

function CreateAccountPage(){
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    repassword: "", 
  });
  const router = useRouter(); 

  // update user's input via 'value'
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Account Created.");
    // route to login page 
    router.push("/Login");
  };

  return (
    <div className="bg-sign-in min-h-screen flex items-center justify-center ">

      <div className="absolute top-0 left-0 w-full flex flex-col items-center">
          <Image src={"/images/electrium.png"} width={160} height={110} className="absolute top-[50px]" alt="Electrium logo" />
          <h1 className="text-2xl font-bold text-[#6AB657] m-0 absolute top-[120px]">Let's get started with your username</h1>   
          <h1 className="text-2xl font-bold text-[#6AB657] m-0 absolute top-[150px]">and password</h1>   
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-5"
      >
        
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full mt-5 p-2 rounded-xl bg-[#7676804D] text-white border-2 focus:outline-none focus:border-[#6AB657] border-transparent"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full mt-5 p-2 rounded-xl bg-[#7676804D] text-white border-2 focus:outline-none focus:border-[#6AB657] border-transparent"
          required
        />

        <input
          type="repassword"
          name="repassword"
          placeholder="Re-enter password"
          value={formData.repassword}
          onChange={handleChange}
          className="w-full mt-5 p-2 rounded-xl bg-[#7676804D] text-white border-2 focus:outline-none focus:border-[#6AB657] border-transparent"
          required
        />

        {/* continue button with arrow */}
        <div className="flex justify-end mt-5"> 
          <button
            type="submit"
            className="mt-3 bg-[#6AB657] text-white w-12 h-12 rounded-full rounded-3xl flex items-center justify-center align-right"
          >
            <svg className="w-6 h-6 text-[#457D2E] dark:text-[#457D2E]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
          </button>
        </div>

      </form>

      {/* green bar status */}
      <div className="absolute bottom-0 left-0 w-full">
        <div className="bg-[#6AB657] h-2.5 w-1/3"></div>
      </div>

    </div>
  );
} 

export default CreateAccountPage; 
