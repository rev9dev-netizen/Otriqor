import * as React from "react";
import { GalleryGrid } from "@/components/library/gallery-grid";

export default function LibraryPage() {
  return (
    <div className="flex flex-col h-full bg-[#09090b] text-white">
        <div className="p-6 border-b border-white/5">
            <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
            <p className="text-neutral-400 text-sm mt-1">Your AI generated gallery</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
            <GalleryGrid />
        </div>
    </div>
  );
}
