'use client';

import React, {useState, useEffect} from 'react';
import Dropdown from "./Dropdown"; 

export default function SearchBar(){ 
    // temp dummy data 
    const tempValue = ["University of Waterloo, Dana Porta Library, Engineering 7 (E7)"]; 
    const [value, setValue] = useState("Testing..."); 

    <div> 
        <Dropdown 
            options={tempValue}
            selectedOption={setValue}   
        /> 
        <p>Selected: {value}</p>
    </div> 
}
