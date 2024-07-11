'use client'
import React from "react";
import dynamic from "next/dynamic";

const AudioInputBtn = dynamic(() => import('./component/audioInputBtn'), {ssr:false})

const XunFeiInput = () => {


return (
    <>
<AudioInputBtn />
    </>
);
};

export default XunFeiInput;
  