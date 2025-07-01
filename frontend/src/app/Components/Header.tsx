'use client';

import React from 'react';
import { LucideZap, LucideBookmark, LucideClock, LucidePlus, LucideSearch } from 'lucide-react';

const Header = () => {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-50 h-14">
      <div className="flex items-center px-4 h-full backdrop-blur-lg bg-white/20 border border-white/40 rounded-full shadow-md w-[360px]">
        <input
          type="text"
          placeholder="Search Electriumap"
          className="bg-transparent outline-none text-black placeholder-black/70 w-full text-sm"
        />
        <LucideSearch className="w-5 h-5 text-black/70" />
      </div>

      <div className="flex items-center justify-between gap-6 px-6 h-full backdrop-blur-lg bg-white/20 border border-white/40 rounded-full shadow-md text-black">
        <button className="flex flex-col items-center justify-center text-black w-20">
          <LucideZap className="w-6 h-6 text-black" />
          <span className="text-[10px] mt-1 whitespace-nowrap">Outlets Near Me</span>
        </button>

        <button className="flex flex-col items-center justify-center text-black w-14">
          <LucideBookmark className="w-6 h-6 text-black" />
          <span className="text-[10px] mt-1 whitespace-nowrap">Saved</span>
        </button>

        <button className="flex flex-col items-center justify-center text-black w-14">
          <LucideClock className="w-6 h-6 text-black" />
          <span className="text-[10px] mt-1 whitespace-nowrap">Recents</span>
        </button>

        <button className="flex flex-col items-center justify-center text-black w-16">
          <LucidePlus className="w-6 h-6 text-black" />
          <span className="text-[10px] mt-1 whitespace-nowrap">Add Outlet</span>
        </button>
      </div>

      <div className="flex items-center justify-center h-full aspect-square rounded-full backdrop-blur-lg bg-white/20 border border-white/40 shadow-md text-black font-semibold text-sm">
        AG
      </div>
    </div>
  );
};

export default Header;
