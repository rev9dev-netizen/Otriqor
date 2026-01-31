"use client";

import React from "react";
import Lottie from "lottie-react";
import loadingAnimation from "@/public/loading.json";

export function ThinkingAnimation() {
  return (
    <div className="flex items-center">
       <Lottie 
         animationData={loadingAnimation} 
         loop={true} 
         className="w-12 h-12 -ml-2" 
       />
    </div>
  );
}
