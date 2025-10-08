"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { default as NextImage } from "next/image";
import { useUserData } from "../../create-account/UserDataContext";

const compressImage = (file: File): Promise<{ compressedFile: File, previewUrl: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image(); 
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob((blob) => {
          if (!blob) return;
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          const previewUrl = URL.createObjectURL(blob);
          resolve({ compressedFile, previewUrl });
        }, 'image/jpeg', 0.5); // 50% quality
      };
    };
  });
};

function ProfilePage(){
  const [profileData, setProfileData] = useState({
    FirstName: "",
    LastName: "",
  });
  const [errorMsg, setErrorMsg] = useState(''); 
  const router = useRouter(); 
  const { userData, setUserData } = useUserData();

  useEffect(() => {
    setProfileData({
      FirstName: userData.firstName || "",
      LastName: userData.lastName || "",
    });
  }, [userData]);

  // Add profile image handler
  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const { compressedFile, previewUrl } = await compressImage(file);
    
    // Update context with compressed file and preview
    setUserData(prev => ({
      ...prev,
      profileImage: compressedFile,
      profileImagePreview: previewUrl
    }));
  } catch (error) {
    console.error('Error compressing image:', error);
    setErrorMsg('Failed to process image. Please try again.');
  }
};

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

    setUserData((prev) => ({
      ...prev,
      firstName: profileData.FirstName,
      lastName: profileData.LastName,
    }));

    router.push("/create-account/vehicle");
  };

  return (
    <div className="bg-sign-in min-h-screen flex items-center justify-center ">

      <div className="absolute top-0 left-0 w-full flex flex-col items-center">
          <NextImage src={"/images/electrium.png"} width={160} height={110} className="absolute top-[80px]" alt="Electrium logo" />
          <h1 className="text-2xl font-bold text-[#6AB657] m-0 absolute top-[160px]">Add your personal details</h1>
          <div className="relative absolute top-[210px]">
            <NextImage 
              src={userData.profileImagePreview || "/images/default_profile.png"} 
              width={150} 
              height={150} 
              className="rounded-full object-cover" 
              alt="Profile" 
            />
            <label className="absolute -bottom-2 -right-1 z-10 flex items-center justify-center h-10 w-10 rounded-full bg-[#6AB657] text-white shadow-md cursor-pointer hover:bg-[#457D2E] transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </label>
          </div>
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
