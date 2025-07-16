// dropdown component for search bar 
"use client"; 

import React, { useState, useEffect, useRef } from "react"; 
import { LucideMapPin, LucideClock } from 'lucide-react';

type DropdownProps = { 
    options: string[]; 
    selectedOption: (value: string) => void; // takes a string and returns nothing for now 
}

const Dropdown: React.FC<DropdownProps> = ({ options, selectedOption }) => { 
    const [searchText, setSearchText] = useState(""); 
    const [filteredOptions, setfilteredOptions] = useState<string[]>(options); 
    const [showDropDown, setShowDropDown] = useState(false); 
    const searchValueRef = useRef(null); // store input value without need of re-rendering 

    // extract unique titles of locations 
    const uniqueTitles = Array.from(
      new Set(options.map(option => option.split(",")[0].trim()))
    );
    
    const filteredTitles = uniqueTitles.filter(title => 
      title.toLowerCase().includes(searchText.toLowerCase())
    );

    // handle search text and changes filter options accordingly 
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => { 
        setSearchText(e.target.value); 
        setfilteredOptions(options.filter((option) => option.toLowerCase().includes((e.target.value).toLowerCase()))); 
        setShowDropDown(true); 
    };
    
    // disable dropdown when options is clicked, reset values 
    const optionPressed = (option: string) => { 
        setSearchText(option); 
        setfilteredOptions(options);
        setShowDropDown(false); 
        selectedOption(option); 
    }; 

    return( 
        <div className="relative w-full">
            <input 
                ref={searchValueRef}
                type="text"
                value={searchText}
                onChange={handleSearch}
                placeholder="Search Electriumap" 
                className="bg-transparent outline-none text-white placeholder-white/60 w-full text-md"
            />  

            {/* display drop down options only if showDropDown is true */}
            {showDropDown && filteredOptions.length > 0 && ( 
                <div className="absolute mt-4 w-full z-50 rounded-b-xl backdrop-blur-sm bg-white/10 border-x-2 border-b-2 border-white/40 text-white shadow-lg max-h-60 overflow-y-auto">
                    {/* "near me" location option */}
                    <div
                        className="flex items-start gap-3 px-4 py-3 hover:bg-white/25 cursor-pointer transition-colors"
                        // keep search bar empty, need to render map to user's location 
                        onClick={() => optionPressed("")} 
                    >
                        <LucideMapPin className="w-5 h-5 text-white" />
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold leading-tight">Near Me</span>
                        </div>
                    </div> 

                    {/* dynamically render the search options from array*/}
                    {filteredOptions.map((title, index) => {     
                        return ( 
                            <div 
                                key={index}
                                onClick={() => optionPressed(title)}
                                className="flex items-start gap-3 px-4 py-3 hover:bg-white/25 cursor-pointer transition-colors"
                            > 
                                <LucideClock className="w-5 h-5 font-semibold text-white" />
                                {/* display droptown search options veritcally */}
                                <div className="flex flex-col"> 
                                    <span className="text-sm font-semibold leading-tight">{title}</span>
                                </div>
                            </div> 
                        ); 
                    })}
                </div> 
            )}
        </div>  
    );
};

export default Dropdown; 