// dropdown component for search bar 
"use client"; 

import React, { useState, useEffect, useRef } from "react"; 
import { LucideMapPin, LucideClock } from 'lucide-react';

type DropdownProps = { 
    options: string[]; // list of locations 
    address: string[]; // associated addresses to locations 
    selectedOption: (value: string) => void; 
}

const Dropdown: React.FC<DropdownProps> = ({ options, address, selectedOption }) => { 
    const [searchText, setSearchText] = useState(""); 
    const [filteredOptions, setfilteredOptions] = useState<string[]>(options); 
    const [showDropDown, setShowDropDown] = useState(false); 
    const searchValueRef = useRef(null); // store input value without need of re-rendering 
    
    // filter the titles based on current search input 
    const filteredTitles = options.filter(title => 
      title.toLowerCase().includes(searchText.toLowerCase())
    );

    // handle user input change in search bar and changes filter options accordingly 
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => { 
        setSearchText(e.target.value); 
        setfilteredOptions(options.filter((option) => option.toLowerCase().includes((e.target.value).toLowerCase()))); 
        setShowDropDown(true); 
    };
  
    // disable dropdown when options is clicked, reset values 
    const optionPressed = (option: string) => { 
        setSearchText(option); 
        setfilteredOptions(options); // reset options 
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
                className="bg-transparent outline-none text-white placeholder-white/60 w-full text-md px-4"
            />  

            {/* display drop down panel - only show if showDropDown is true */}
            {showDropDown && filteredOptions.length > 0 && ( 
                <div className="absolute left-1 top-full mt-3.5 w-[350px] z-50 rounded-b-[28px] backdrop-blur-sm bg-white/10 border-x-2 border-b-2 border-white/40 text-white shadow-lg max-h-60 overflow-y-auto">
                    {/* "near me" location drop down option */}
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

                    {/* render the filtered titles as dropdown options from array*/}
                    {filteredTitles.map((title, index) => { 
                        // match origin index with associated address   
                        const optionsIndex = options.indexOf(title);
                        const matchedAddress = address[optionsIndex]; 
                         
                        return ( 
                            <div 
                                key={index}
                                onClick={() => optionPressed(title)}
                                className="flex items-start gap-3 px-4 py-3 hover:bg-white/25 cursor-pointer transition-colors"
                            > 
                                <LucideClock className="w-6 h-5 font-semibold text-white" />
                                {/* display droptown search options veritcally */}
                                <div className="flex flex-col"> 
                                    <span className="text-sm font-semibold leading-tight">{title}</span>
                                    <span className="text-xs text-white/60">{matchedAddress}</span>
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