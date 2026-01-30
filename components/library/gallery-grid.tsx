/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { fetchUserGallery } from "@/lib/supabase/db";
import { MediaTile } from "./media-tile";
import { Loader2 } from "lucide-react";

export function GalleryGrid() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {   
      const load = async () => {
          try {
              const messages = await fetchUserGallery();
              if (!messages) return;

              // Parse messages to extract images
              const galleryItems: any[] = [];
              const regex = /!\[(.*?)\]\((.*?)\)/g;

              messages.forEach((msg: any) => {
                  let match;
                  // Loop through all matches in a single message
                  while ((match = regex.exec(msg.content)) !== null) {
                      galleryItems.push({
                          id: msg.id,
                          src: match[2],
                          alt: match[1] || "AI Image",
                          chatId: msg.chats?.id,
                          timestamp: new Date(msg.created_at).getTime()
                      });
                  }
              });

              setItems(galleryItems);
          } catch (e) {
              console.error("Failed to load gallery", e);
          } finally {
              setLoading(false);
          }
      };
      load();
  }, []);

  if (loading) {
      return (
          <div className="flex h-full items-center justify-center text-white/50">
              <Loader2 className="h-6 w-6 animate-spin" />
          </div>
      );
  }

  if (items.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
              <p>No images generated yet.</p>
          </div>
      );
  }

  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {items.map((item, idx) => (
            <MediaTile 
                key={`${item.id}-${idx}`}
                src={item.src}
                alt={item.alt}
                chatId={item.chatId}
                messageId={item.id}
                timestamp={item.timestamp}
            />
        ))}
    </div>
  );
}
