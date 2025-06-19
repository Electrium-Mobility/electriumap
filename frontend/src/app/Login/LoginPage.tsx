"use client"; 

import React, {useState} from 'react';
import Image from 'next/image'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// import * as Yup from "yup";

type LoginPageProps = { 
    username: string; 
    password: string; 
}

type AuthButtonProps = { 
    src: string; 
    alt: string; 
    text: string; 
};

const AuthButton: React.FC<AuthButtonProps> = ({src, alt, text}) => ( 
    <button className="flex items-center gap-2 justify-center border border-white text-white px-2 py-1 rounded hover:bg-green-700 transition w-full"> 
        <Image src={src} alt={alt} width={20} height={20} />
        {text}
    </button>
);

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState(''); 
    const [pwd, setPwd] = useState(''); 
    const router = useRouter()

    // pop-up alert for form validation (username and password) 
    const handleLogin = (event: React.FormEvent) => { 
        event.preventDefault(); 
        if(!username || !pwd){ 
            alert("Please enter your username and password.")
            return; 
        }
        alert('Submitted successfully.')
        // after user successfully logins, change route to map page 
        router.push('/');
    };  

    return(
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <h1 className="text-2xl font-bold text-white mt-20 mb-1">Sign In Electriumap</h1> 
            <form onSubmit={handleLogin} className="w-[400px]"> 
            <div className="flex flex-col gap-3">
                <label htmlFor="username" className="mb-0 font-medium">Username</label>
                <div className="flex gap-4 items-center flex-col sm:flex-row">
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 rounded border border-white bg-black text-white"/>
                </div>
                <label htmlFor="password" className="mb-0 font-medium">Password</label>
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
                    type="submit"
                    // onClick={() => router.push('/')}
                    >Login</button>
                </div>
            </div>

            {/* different open authorization buttons for login*/}
            <div className="w-[400px] flex flex-col gap-2 mt-10"> 
                <AuthButton src="/images/google_logo.png" alt="Google" text="Continue with Google" />
                <AuthButton src="/images/facebook_logo.png" alt="Facebook" text="Continue with Facebook" />
                <AuthButton src="/images/apple_logo.png" alt="Apple" text="Continue with Apple" />
            </div> 

            </form> 
            <p className="text-white"> Don't have an account? {" "}
                <Link href="/create-account">Sign up</Link> 
            </p>
        </div>
        );  
    }

 export default LoginPage; 
 