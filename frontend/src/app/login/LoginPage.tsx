"use client"; 

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; 
import Link from 'next/link';

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
    <button className="flex items-center gap-3 justify-center border border-[#848488] text-white px-2 py-1 rounded bg-[#2B2D2B] hover:bg-[#2E7D32] transition w-full mt-2"> 
        <Image src={src} alt={alt} width={20} height={20} />
        <span >{text}</span>
    </button>
);

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState(''); 
    const [pwd, setPwd] = useState(''); 
    const [showPwd, setShowPwd] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const router = useRouter()

    // pop-up alert for form validation (username and password) 
    const handleLogin = (event: React.FormEvent) => { 
        event.preventDefault(); 
        if(!username || !pwd){ 
            setErrorMsg("Please enter valid username and password");
            return; 
        }
        alert('Submitted successfully.')
        // after user successfully logins, change route to map page 
        router.push('/');
    };  

    return(
        <div className="bg-sign-in grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <div className="flex items-center justify-center h-screen gap-2">
                <Image src={"/images/electrium.png"} width={160} height={110} className="absolute top-[50px]" alt="Electrium logo" />
                <h1 className="text-4xl font-bold text-white m-0 absolute top-[120px]">Electriumap</h1>   
            </div>

            <form onSubmit={handleLogin} className="w-[400px]"> 
            <div className="flex flex-col gap-3 mt-5">
                {/* <label htmlFor="username" className="mb-0 font-medium">Username</label> */}
                <div className="flex gap-4 items-center flex-col sm:flex-row" >
                <input
                    id="username"
                    type="text"
                    value={username}
                    placeholder='Username'
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 rounded bg-[#7676804D] text-white border-2 focus:outline-none focus:border-[#6AB657] border-transparent"/>
                </div>

                <div className="relative flex gap-4 items-center flex-col sm:flex-row">
                    <input
                        id="password"
                        type={showPwd ? "text" : "password" }
                        placeholder='Password'
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        className="w-full p-2 rounded  bg-[#7676804D] text-white border-2 focus:outline-none focus:border-[#6AB657] border-transparent"/>

                    {/* enable toggle password */}
                    <button 
                        type="button"
                        onClick={() => setShowPwd((prev) => !prev)}
                        className="absolute right-3 top-1/3 transform"
                    > 
                        {showPwd ? <Image src={"/images/hidden_toggle.png"} width={23} height={25} alt="hidden view" /> : <Image src={"/images/nonhidden_toggle.png"} width={25} height={25} alt="non-hidden view" />}
                    </button>
                </div>

                {/* render error message if errorMsg is not empty*/}
                {errorMsg && ( <p className='text-red-500 text-sm'>{errorMsg}</p>)}

                <div className="flex gap-4 items-center flex-col sm:flex-row mt-3">
                    <button 
                        className="w-full text-white p-2 rounded"
                        style={{backgroundColor:'#2E7D32'}}
                        type="submit"
                        // onClick={() => router.push('/')}
                            >Log In</button>
                </div>

                {/* divider  */}
                <div className="flex items-center w-full"> 
                    <div className='flex-grow h-px bg-[#848488]'></div>
                    <span className='mx-4 text-[#848488]'>or </span> 
                    <div className='flex-grow h-px bg-[#848488]'></div>
                </div>
            </div>

            {/* different open authorization buttons for login*/}
            <div className="w-[400px] flex flex-col gap-2 mt-5"> 
                <AuthButton src="/images/google_logo.png" alt="Google" text="Continue with Google" />
                <AuthButton src="/images/facebook_logo.png" alt="Facebook" text="Continue with Facebook" />
                <AuthButton src="/images/apple_logo.png" alt="Apple" text="Continue with Apple" />
            </div> 

            </form> 
            <p className="font-semibold" style={{color:'#2E7D32'}}> Don't have an account? {" "}
                <Link href="/create-account">Sign up</Link> 
            </p>
        </div>
        );  
    }

 export default LoginPage; 

