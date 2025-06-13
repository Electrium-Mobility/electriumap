"use client"; 

import React, {useState} from 'react';
// import * as Yup from "yup";

type LoginPageProps = { 
    username: string; 
    password: string; 
}

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState(''); 
    const [pwd, setPwd] = useState(''); 

    // pop-up alert for form validation (username and password) 
    const handleLogin = (event: React.FormEvent) => { 
        event.preventDefault(); 

        if(!username || !pwd){ 
            alert("Please enter your username and password.")
            return; 
        }

        alert('Submitted successfully.')
    };  

    return(
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <h1 className="text-2xl font-bold text-white mt-40 mb-1">Sign In Electriumap</h1> 
            <form onSubmit={handleLogin} className="w-[300px]"> 
            <div className="flex flex-col gap-3">
                <label htmlFor="username" className="mb-1 font-medium">Username</label>
                <div className="flex gap-4 items-center flex-col sm:flex-row">
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 rounded border border-white bg-black text-white"/>
                </div>
                <label htmlFor="password" className="mb-1 font-medium">Password</label>
                <div className="flex gap-4 items-center flex-col sm:flex-row">
                <input
                    id="password"
                    type="password"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    className="w-full p-2 rounded border border-white bg-black text-white"/>
                </div>
                <div className="flex gap-4 items-center flex-col sm:flex-row">
                <button 
                    className="w-full bg-white text-black p-2 rounded hover:bg-gray-200 transition"
                    type="submit">Login</button>
                </div>
            </div>
            </form> 
        </div>
        );  
    }

 export default LoginPage; 
 