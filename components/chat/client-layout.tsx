"use client";

import * as React from "react";
import { Sidebar } from "@/components/sidebar/sidebar";
import { cn } from "@/lib/utils";

export function ClientChatLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header (Hidden on Desktop usually, but good for accessibility) */}
        
        <main className={cn(
            "flex-1 overflow-auto w-full mx-auto transition-all duration-300",
             // When sidebar is closed, we still want it centered but maybe we adjust max-width?
             // ChatGPT keeps it centered in the remaining space.
             "max-w-full" 
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
