"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; 

function CreateAccountPage(){
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
    <div className="min-h-screen flex items-center justify-center ">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-black">Create an Account</h2>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-3 border rounded-xl focus:outline-none focus:ring focus:border-blue-400 text-black"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-3 border rounded-xl focus:outline-none focus:ring focus:border-blue-400 text-black"
          required
        />

        <button
          type="submit"
          className="w-full bg-black text-white py-3 rounded-xl hover:bg-green-700 transition w-full"
        >
          Create Account
        </button>
      </form>
    </div>
  );
} 

export default CreateAccountPage; 
