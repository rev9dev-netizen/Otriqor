/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface Image {
  src: string;
  alt: string;
}

interface ImageCarouselProps {
  images: Image[];
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Progressive Loading: Always show the full grid structure.
  // We fill undefined slots with placeholders to prevent layout shift.
  const displayImages = [...images];
  while (displayImages.length < 3) {
      displayImages.push({ src: '', alt: '' });
  }
  
  const count = images.length;
  const hasContent = count > 0;

  if (!hasContent) return <GallerySkeleton />;

  const openLightbox = (index: number) => {
      if (index < count) setLightboxIndex(index);
  };
  
  const closeLightbox = () => setLightboxIndex(null);

  return (
    <>
      <div className="my-6 rounded-2xl overflow-hidden border border-white/10 bg-[#1e1e1e] shadow-sm select-none animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-1 h-[300px] md:h-[350px]">
          
          {/* SLOT 0: HERO (Left) */}
          <div 
             className="relative overflow-hidden group cursor-pointer col-span-1 md:col-span-8 bg-white/5"
             onClick={() => openLightbox(0)}
          >
            {displayImages[0].src ? (
                <ImageWithSkeleton src={displayImages[0].src} alt={displayImages[0].alt} />
            ) : (
                <div className="w-full h-full animate-pulse bg-white/5" />
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-1 col-span-1 md:col-span-4 h-full">
               
               {/* SLOT 1: Top Right */}
               <div 
                 className="relative flex-1 overflow-hidden group cursor-pointer bg-white/5"
                 onClick={() => openLightbox(1)}
               >
                 {displayImages[1].src ? (
                    <ImageWithSkeleton src={displayImages[1].src} alt={displayImages[1].alt} />
                 ) : (
                    <div className="w-full h-full animate-pulse bg-white/5" />
                 )}
               </div>

               {/* SLOT 2: Bottom Right */}
               <div 
                   className="relative flex-1 overflow-hidden group cursor-pointer bg-white/5"
                   onClick={() => openLightbox(2)}
                 >
                   {displayImages[2].src ? (
                      <>
                        <ImageWithSkeleton src={displayImages[2].src} alt={displayImages[2].alt} />
                        {/* Overlay for +N */}
                        {count > 3 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                            <span className="text-white font-medium text-lg">+{count - 3}</span>
                            </div>
                        )}
                      </>
                   ) : (
                      <div className="w-full h-full animate-pulse bg-white/5" />
                   )}
                 </div>
            </div>
        </div>
      </div>

      {/* LIGHTBOX OVERLAY */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
           <button 
             onClick={closeLightbox}
             className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
           >
             <X size={32} />
           </button>
           
           <div className="max-w-5xl w-full max-h-screen flex flex-col items-center">
              <img 
                src={images[lightboxIndex].src} 
                alt={images[lightboxIndex].alt} 
                className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl"
              />
              <div className="mt-4 flex gap-4 items-center">
                 <p className="text-white/80 font-medium text-lg text-center">{images[lightboxIndex].alt}</p>
                 <a 
                   href={images[lightboxIndex].src} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20"
                 >
                   <ExternalLink size={20} />
                 </a>
              </div>

              {/* Lightbox Thumbnails */}
              <div className="mt-6 flex gap-2 overflow-x-auto max-w-full pb-2">
                 {images.map((img, idx) => (
                   <button
                     key={idx}
                     onClick={() => setLightboxIndex(idx)}
                     className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${lightboxIndex === idx ? 'border-white scale-105' : 'border-transparent opacity-50 hover:opacity-100'}`}
                   >
                     <img src={img.src} className="w-full h-full object-cover" />
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}
    </>
  );
};

// Internal component for handling individual image loading state
const ImageWithSkeleton = ({ src, alt }: { src: string, alt: string }) => {
    const [loaded, setLoaded] = useState(false);
    
    return (
        <div className="w-full h-full relative bg-neutral-800 animate-pulse">
            <img 
                src={src} 
                alt={alt}
                onLoad={() => setLoaded(true)}
                className={`w-full h-full object-cover transition-all duration-500 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
            />
        </div>
    );
};

export const GallerySkeleton = () => (
    <div className="my-6 rounded-2xl overflow-hidden border border-white/10 bg-[#1e1e1e] shadow-sm h-[300px] md:h-[350px] animate-pulse">
        <div className="grid grid-cols-12 gap-1 h-full">
            <div className="col-span-8 bg-neutral-800/50"></div>
            <div className="col-span-4 flex flex-col gap-1 h-full">
                <div className="flex-1 bg-neutral-800/50"></div>
                <div className="flex-1 bg-neutral-800/50"></div>
            </div>
        </div>
    </div>
);

