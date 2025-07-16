"use client";

import React, { useState, useRef, useEffect } from "react"; 
import { LucideMapPin, LucideClock } from 'lucide-react';

type DropdownProps = { 
    options: string[]; 
    address: string[]; 
    selectedOption: (value: string) => void; 
    showDropDown: boolean;
    setShowDropDown: (value: boolean) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ options, address, selectedOption, showDropDown, setShowDropDown }) => { 
    const [searchText, setSearchText] = useState(""); 
    const [filteredOptions, setFilteredOptions] = useState<string[]>(options); 
    const dropdownRef = useRef<HTMLDivElement>(null);
    // handle user input change in search bar and changes filter options accordingly 
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => { 
        const value = e.target.value;
        setSearchText(value); 
        setFilteredOptions(options.filter((option) =>
          option.toLowerCase().includes(value.toLowerCase())
        ));
        setShowDropDown(true); 
    };
  
    // disable dropdown when options is clicked, reset values 
    const optionPressed = (option: string) => { 
        setSearchText(option); 
        setFilteredOptions(options); 
        setShowDropDown(false); 
        selectedOption(option); 
    };

    // close dropdown on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setShowDropDown(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return ( 
        <div className="relative w-full" ref={dropdownRef}>
            <input 
                type="text"
                value={searchText}
                onChange={handleSearch}
                placeholder="Search Electriumap" 
                className="bg-transparent outline-none text-white placeholder-white/60 w-full text-md px-4"
            />  
            {/* display dropdown panel only if results exist */}
            {showDropDown && filteredOptions.length > 0 && (
                <div className="absolute top-full -left-4 mt-4 w-[360px] z-30">
                    {/* connector bridge to searchbar */}
                    {/* <div className="h-4 w-full border-x-2 border-white/40"/> */}
                    
                    {/* display drop down panel */}
                    <div className="backdrop-blur-sm bg-white/15 border-x-2 border-b-2 border-white/40 rounded-b-[28px] shadow-lg text-white max-h-60 overflow-y-auto">
                        
                        {/* "near Me" option */}
                        <div
                            className="flex items-center gap-3 px-4 py-3 hover:bg-white/25 cursor-pointer transition-colors"
                            onClick={() => optionPressed("")}
                        >
                            <LucideMapPin className="w-6 h-5 text-white" />
                            <div className="flex flex-col h-8">
                                <span className="text-sm mt-2 font-semibold leading-tight">Near Me</span>
                            </div>
                        </div> 

                        {/* Other dropdown options */}
                        {filteredOptions.map((title, index) => {
                            const originalIndex = options.indexOf(title);
                            const matchedAddress = address[originalIndex];
                            return (
                                <div 
                                    key={index}
                                    onClick={() => optionPressed(title)}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/25 cursor-pointer transition-colors border-t border-white/40"
                                >
                                    <LucideClock className="w-6 h-5 text-white" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold leading-tight">{title}</span>
                                        <span className="text-xs text-white/60">{matchedAddress}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>  
    );
};

export default Dropdown;
