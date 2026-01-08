"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { auth } from "../firebase/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handlePasswordReset = async (event: React.FormEvent) => {
        event.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!email) {
            setErrorMsg("Please enter your email address");
            return;
        }
        setIsLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccessMsg("Password reset email sent! Please check your inbox.");
            setEmail('');
            
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                setErrorMsg("No account found with this email address");
            } else if (error.code === 'auth/invalid-email') {
                setErrorMsg("Invalid email address");
            } else if (error.code === 'auth/too-many-requests') {
                setErrorMsg("Too many requests. Please try again later");
            } else {
                setErrorMsg("Failed to send reset email. Please try again");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-sign-in grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            
            <div className="flex items-center justify-center h-screen gap-2">
                <Image 
                    src={"/images/electrium.png"} 
                    width={160} 
                    height={110} 
                    className="absolute top-[50px]" 
                    alt="Electrium logo" 
                />
                <h1 className="text-4xl font-bold text-white m-0 absolute top-[120px]">
                    Electriumap
                </h1>
            </div>

            <form onSubmit={handlePasswordReset} className="w-[400px]">
                <div className="flex flex-col gap-3 mt-5">
                    <h2 className="text-2xl font-semibold text-white text-center mb-2">
                        Reset Password
                    </h2>
                    <p className="text-[#848488] text-center mb-4">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

                    <div className="flex gap-4 items-center flex-col sm:flex-row">
                        <input
                            id="email"
                            type="email"
                            value={email}
                            placeholder="Email Address"
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="w-full p-2 rounded bg-[#7676804D] text-white border-2 focus:outline-none focus:border-[#6AB657] border-transparent disabled:opacity-50"
                        />
                    </div>

                    {/* Error message */}
                    {errorMsg && (
                        <p className="text-red-500 text-sm text-center">{errorMsg}</p>
                    )}

                    {/* Success message */}
                    {successMsg && (
                        <p className="text-green-500 text-sm text-center">{successMsg}</p>
                    )}

                    <div className="flex gap-4 items-center flex-col sm:flex-row mt-3">
                        <button
                            className="w-full text-white p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#2E7D32' }}
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </div>

                    <div className="flex items-center justify-center w-full mt-4">
                        <p className="font-semibold" style={{ color: '#2E7D32' }}>
                            Remember your password?{" "}
                            <Link href="/login">Back to Login</Link>
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ForgotPasswordPage;