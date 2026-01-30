import * as React from "react";
import { Plus, Settings, Sparkles, MessageSquare, LayoutGrid, Compass, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/hooks/use-auth";
import { chatStore } from "@/lib/store/chat-store";
import { useRouter, usePathname } from "next/navigation";

// ... imports

interface SidebarRailProps {
  onToggle: () => void;
  onOpenSettings: () => void;
}

export function SidebarRail({ onToggle, onOpenSettings }: SidebarRailProps) {
  const router = useRouter(); 
  const pathname = usePathname();
  const { user: currentUser } = useAuth();
  
  const railItems = [
      { 
          icon: MessageSquare, 
          label: "Chats", 
          // Active if root or starts with /c/, but strictly NOT /library or /models
          active: pathname === '/' || (pathname?.startsWith('/c/') && !pathname?.startsWith('/library') && !pathname?.startsWith('/models')),
          onClick: onToggle 
      },
      {
          icon: Box,
          label: "Models",
          active: pathname === '/models',
          onClick: () => router.push('/models')
      },
      { 
          icon: LayoutGrid, 
          label: "Library", 
          active: pathname === '/library',
          onClick: () => router.push('/library')
      },
      // ...
  ];

  // ... (rest of render logic remains similar, just removing onOpenProviderSettings usage)
  return (
      <div className="w-[60px] flex flex-col items-center py-4 gap-4 border-r border-white/5 bg-[#0e0e0e]">
         {/* Logo */}
         <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-900/20 mb-2">
             <Sparkles className="text-white h-4 w-4" />
         </div>

         {/* Rail Items */}
         <div className="flex flex-col gap-3 w-full px-2">
             {railItems.map((item) => (
                 <TooltipProvider key={item.label}>
                 <Tooltip>
                     <TooltipTrigger asChild>
                         <button 
                             onClick={() => {
                                 if (item.label === "Chats" && !pathname.startsWith('/c/') && pathname !== '/') {
                                     router.push('/');
                                 } else {
                                     item.onClick();
                                 }
                             }}
                             className={cn(
                             "h-10 w-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-300 group relative mx-auto",
                             item.active 
                                ? "bg-white/10 text-white shadow-inner" 
                                : "text-neutral-500 hover:text-white hover:bg-white/5"
                         )}>
                             <item.icon className={cn("h-4 w-4", item.label === "Models" && "text-purple-400")} />
                             {item.active && <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-purple-500 rounded-r-full" />}
                         </button>
                     </TooltipTrigger>
                     <TooltipContent side="right">{item.label}</TooltipContent>
                 </Tooltip>
                 </TooltipProvider>
             ))}
             
             <div className="h-px w-8 bg-white/10 my-1 mx-auto" />
             
             {/* New Chat Rail Button */}
             <TooltipProvider>
                 <Tooltip>
                     <TooltipTrigger asChild>
                        <button 
                            onClick={() => {
                                chatStore.reset();
                                router.push('/');
                            }}
                            className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:border-white/30 hover:bg-white/5 transition-all mx-auto"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                     </TooltipTrigger>
                     <TooltipContent side="right">New Chat</TooltipContent>
                 </Tooltip>
             </TooltipProvider>
         </div>

         <div className="flex-1" />

         {/* Bottom Actions */}
         <div className="flex flex-col gap-3 pb-4">
             <button onClick={onOpenSettings} className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors mx-auto">
                 <Settings className="h-4 w-4" />
             </button>
             
             {/* Profile Avatar */}
             {currentUser ? (
                <div className="h-9 w-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs cursor-pointer mx-auto shadow-lg hover:ring-2 hover:ring-white/20 transition-all">
                    {currentUser.email?.charAt(0).toUpperCase()}
                </div>
             ) : (
                <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 text-xs mx-auto">?</div>
             )}
         </div>
      </div>
  );
}
