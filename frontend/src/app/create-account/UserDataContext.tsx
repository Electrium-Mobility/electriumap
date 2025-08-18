// This file defines a React context for managing user data across the application.
// It provides a default user data structure, a context provider, and a custom hook for accessing and updating user data.

"use client";

import React, { createContext, useContext, useState } from "react";

type UserData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  vehicle: { title: string; type: string };
  profileImage?: File | null;
  profileImagePreview?: string;
};

const defaultUserData: UserData = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  vehicle: { title: "", type: "" },
  profileImage: undefined,
  profileImagePreview: undefined
};

const UserDataContext = createContext<{
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}>({
  userData: defaultUserData,
  setUserData: () => {},
});

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(defaultUserData);

  return (
    <UserDataContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => useContext(UserDataContext);