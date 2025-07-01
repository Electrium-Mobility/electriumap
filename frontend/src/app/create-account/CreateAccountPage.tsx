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
  const [showPwd, setShowPwd] = useState(false); 
  const [showRePwd, setShowRePwd] = useState(false); 
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter(); 

  // update user's input via 'value'
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // check fields are not empty 
    if ( !formData.email || !formData.password || !formData.repassword){ 
      setErrorMsg("Please fill out all fields."); 
      return; 
    }

    // ensure password and re-entered passwords match   
    if(!(formData.password === formData.repassword)){ 
      setErrorMsg("Passwords do not match. Please try again.");
      return; 
    }

    setErrorMsg(""); 
    router.push("/create-account/profile");
  };

  return (
    <div className="bg-sign-in min-h-screen flex items-center justify-center ">
      <div className="absolute top-0 left-0 w-full flex flex-col items-center">
          <Image src={"/images/electrium.png"} width={160} height={110} className="absolute top-[100px]" alt="Electrium logo" />
          <h1 className="text-2xl font-bold text-[#6AB657] m-0 absolute top-[180px]">Let's get started with your username</h1>   
          <h1 className="text-2xl font-bold text-[#6AB657] m-0 absolute top-[200px]">and password</h1>   
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm"
      >
        <input
          type="text"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full mt-35 p-2 rounded-xl bg-[#7676804D] text-white border-2 focus:outline-none focus:border-[#6AB657] border-transparent"
        />

        <div className="relative">
          <input
            type={showPwd ? "text" : "password" } 
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full mt-5 p-2 rounded-xl bg-[#7676804D] text-white border-2 focus:outline-none focus:border-[#6AB657] border-transparent"
          />
            {/* enable toggle password */}
            <button 
              type="button"
              onClick={() => setShowPwd((prev) => !prev)}
              className="absolute right-3 top-1/2 transform"
            > 
              {showPwd ? <Image src={"/images/hidden_toggle.png"} width={23} height={25} alt="hidden view" /> : <Image src={"/images/nonhidden_toggle.png"} width={25} height={25} alt="non-hidden view" />}
            </button>
          </div>

        <div className="relative">
          <input
            type={showRePwd ? "text" : "password" }
            name="repassword"
            placeholder="Re-enter password"
            value={formData.repassword}
            onChange={handleChange}
            className="w-full mt-5 p-2 rounded-xl bg-[#7676804D] text-white border-2 focus:outline-none focus:border-[#6AB657] border-transparent"
          />
           {/* enable toggle re-password */}
            <button 
              type="button"
              onClick={() => setShowRePwd((prev) => !prev)}
              className="absolute right-3 top-1/2 transform"
            > 
              {showRePwd ? <Image src={"/images/hidden_toggle.png"} width={23} height={25} alt="hidden view" /> : <Image src={"/images/nonhidden_toggle.png"} width={25} height={25} alt="non-hidden view" />}
            </button>
        </div>

        {/* error message */}
        {errorMsg && ( <p className='text-red-500 text-sm mt-2'>{errorMsg}</p>)}

        {/* continue button with arrow */}
        <div className="flex justify-end mt-5"> 
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
        <div className="bg-[#6AB657] h-2.5 w-1/4"></div>
      </div>
    </div>
  );
} 

export default CreateAccountPage; 
