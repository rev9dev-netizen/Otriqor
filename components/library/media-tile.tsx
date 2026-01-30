/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import Image from "next/image";
import { Download, ExternalLink, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MediaTileProps {
  src: string;
  alt: string;
  chatId: string;
  messageId: string;
  timestamp: number;
}

export function MediaTile({ src, alt, chatId, messageId, timestamp }: MediaTileProps) {
  
  const handleDownload = async () => {
      try {
          const response = await fetch(src);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `zod-image-${timestamp}.png`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
      } catch (e) {
          console.error("Download failed", e);
          window.open(src, '_blank');
      }
  };

  return (
    <div className="group relative break-inside-avoid mb-4 rounded-xl overflow-hidden bg-neutral-900 border border-white/5 hover:border-white/20 transition-all">
        {/* Image */}
        <div className="aspect-auto w-full relative">
            {/* We use standard img tag/next Image. Since we don't know dimensions upfront easily without parsing, we can use fill or just img */}
            <img 
                src={src} 
                alt={alt}
                loading="lazy"
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
            />
        </div>

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
            <div className="flex items-center gap-2 justify-end">
                 <Link href={`/c/${chatId}?msg=${messageId}`}>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/10 hover:bg-white text-white hover:text-black">
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                </Link>
                <Button onClick={handleDownload} size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/10 hover:bg-white text-white hover:text-black">
                     <Download className="h-4 w-4" />
                </Button>
            </div>
        </div>
    </div>
  );
}
