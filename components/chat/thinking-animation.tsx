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
         className="w-18 h-18" // Increased size, negative margin to keep line height tight
       />
    </div>
  );
}
