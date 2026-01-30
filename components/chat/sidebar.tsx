/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Edit2, Archive, Trash2, Pin, MoreHorizontal, Sparkles, Compass, LayoutGrid, MessageSquare, Plus, Search, Settings, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { SettingsDialog } from "@/components/profile/settings-dialog";
import { ProviderSettingsDialog } from "@/components/settings/provider-settings-dialog";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { chatStore } from "@/lib/store/chat-store";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { deleteChat, updateChat } from "@/lib/supabase/db";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ className, isOpen, onToggle }: SidebarProps) {
  const router = useRouter(); 
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isProviderSettingsOpen, setIsProviderSettingsOpen] = React.useState(false);
  const [chats, setChats] = React.useState<any[]>([]);
  const { user: currentUser } = useAuth();
  
  // Dialog State
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [renameId, setRenameId] = React.useState<string | null>(null);
  const [renameTitle, setRenameTitle] = React.useState("");
  
  // Active Chat Logic
  // We can get active chat from URL param using useParams or just chatStore if synced
  // But router.push usage implies we might need to parse path
  // simpler for now:
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const activeChatId = currentPath.split('/c/')[1];

  // Fetch Chats
  React.useEffect(() => {
    if (!currentUser) { setChats([]); return; }
    const initData = async () => {
        const supabase = createClient();
        const { data } = await supabase.from('chats').select('*').order('updated_at', { ascending: false });
        if (data) setChats(data);
    };
    initData();
    const supabase = createClient();
    const channel = supabase.channel('chats_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => initData()).subscribe();
    return () => { supabase.removeChannel(channel); }
  }, [currentUser]);

  // Actions
  const handleDelete = async () => {
      if (deleteId) {
          await deleteChat(deleteId); // Needs import from db not client
          setDeleteId(null);
          if (activeChatId === deleteId) router.push('/');
      }
  };

  const handleRename = async () => {
      if (renameId && renameTitle.trim()) {
          await updateChat(renameId, { title: renameTitle.trim() });
          setRenameId(null);
      }
  };

  const handlePin = async (chat: any) => {
      await updateChat(chat.id, { is_pinned: !chat.is_pinned });
  };

  const handleArchive = async (chat: any) => {
      await updateChat(chat.id, { is_archived: !chat.is_archived });
  };

  // Sidebar Rail Items
  const railItems = [
      { icon: MessageSquare, label: "Chats", active: true },
      { icon: Box, label: "Models" },
      { icon: LayoutGrid, label: "Library" },
      { icon: Compass, label: "Explore" },
  ];

  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? "340px" : "60px" }} 
      className={cn(
        "flex h-full border-r z-50 overflow-hidden select-none",
        "bg-[#121212] border-white/5 shadow-2xl", 
        className
      )}
    >
      {/* 1. Icon Rail (Always Visible) */}
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
                                 if (item.label === "Chats") onToggle();
                                 if (item.label === "Models") setIsProviderSettingsOpen(true);
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
             <button onClick={() => setIsSettingsOpen(true)} className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors mx-auto">
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

      {/* 2. Detail Panel */}
      <AnimatePresence>
      {isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col bg-[#121212] min-w-0" 
          >
             {/* Panel Header */}
             <div className="p-5 flex items-center justify-between">
                 <h2 className="text-lg font-semibold text-white tracking-tight">Chats</h2>
                 <Search className="h-4 w-4 text-neutral-500" />
             </div>
             
             <ScrollArea className="flex-1 w-full overflow-hidden px-1">
                 <div className="flex flex-col pb-2">
                     {chats.map(chat => {
                         const isActive = activeChatId === chat.id;
                         return (
                             // Group allows styling based on children state via group-has logic (if configured) or just group-hover
                             // We use opacity logic on the specific elements
                             <div key={chat.id} className="relative group px-1 py-0.5">
                                 <Link 
                                    href={`/c/${chat.id}`}
                                    className={cn(
                                        "flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer w-full min-w-0 pr-8", // Reduced py, kept px-3. Added spacing for menu.
                                        isActive ? "bg-white/10 text-white" : "hover:bg-white/5 text-neutral-400 hover:text-neutral-200 group-has-[[data-state=open]]:bg-white/5 group-has-[[data-state=open]]:text-neutral-200"
                                    )}
                                 >
                                    <div className="w-0 flex-1">
                                        <span className={cn("block truncate font-medium text-sm", isActive ? "text-white" : "text-neutral-300 group-hover:text-white" )}>
                                            {chat.title || "New Chat"}
                                        </span>
                                    </div>
                                 </Link>

                                 {/* Hover Menu Trigger */}
                                 {/* Visible on group hover OR when the menu is open (data-state=open) */}
                                 <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-has-[[data-state=open]]:opacity-100 transition-opacity">
                                     <DropdownMenu>
                                         <DropdownMenuTrigger asChild>
                                             <button className="p-1 hover:bg-neutral-700/50 rounded-md text-neutral-400 hover:text-white transition-colors">
                                                 <MoreHorizontal className="h-4 w-4" />
                                             </button>
                                         </DropdownMenuTrigger>
                                         <DropdownMenuContent side="right" align="start" sideOffset={8} className="w-48 bg-[#1e1e1e] border-white/10 text-neutral-300">
                                             <DropdownMenuItem onClick={() => {}} className="gap-2 cursor-pointer py-2 focus:bg-white/10 focus:text-white">
                                                 <Copy className="h-4 w-4" /> Share
                                             </DropdownMenuItem>
                                             <DropdownMenuItem onClick={() => {
                                                 setRenameId(chat.id);
                                                 setRenameTitle(chat.title);
                                             }} className="gap-2 cursor-pointer py-2 focus:bg-white/10 focus:text-white">
                                                 <Edit2 className="h-4 w-4" /> Rename
                                             </DropdownMenuItem>
                                             <DropdownMenuItem onClick={() => handlePin(chat)} className="gap-2 cursor-pointer py-2 focus:bg-white/10 focus:text-white">
                                                 <Pin className="h-4 w-4" /> {chat.is_pinned ? "Unpin" : "Pin"}
                                             </DropdownMenuItem>
                                             <DropdownMenuItem onClick={() => handleArchive(chat)} className="gap-2 cursor-pointer py-2 focus:bg-white/10 focus:text-white">
                                                 <Archive className="h-4 w-4" /> {chat.is_archived ? "Unarchive" : "Archive"}
                                             </DropdownMenuItem>
                                             <DropdownMenuSeparator className="bg-white/10" />
                                             <DropdownMenuItem onClick={() => setDeleteId(chat.id)} className="gap-2 text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer py-2">
                                                 <Trash2 className="h-4 w-4" /> Delete
                                             </DropdownMenuItem>
                                         </DropdownMenuContent>
                                     </DropdownMenu>
                                 </div>
                             </div>
                         );
                     })}
                 </div>
             </ScrollArea>

             <div className="h-4" />
          </motion.div>
      )}
      </AnimatePresence>

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <ProviderSettingsDialog open={isProviderSettingsOpen} onOpenChange={setIsProviderSettingsOpen} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent className="bg-[#1e1e1e] border-white/10 text-white sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Delete Chat?</DialogTitle>
                  <DialogDescription className="text-neutral-400">
                      This action cannot be undone. This will permanently delete the chat history.
                  </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:justify-end">
                  <Button variant="ghost" onClick={() => setDeleteId(null)} className="text-neutral-400 hover:text-white hover:bg-white/5">Cancel</Button>
                  <Button variant="destructive" onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      {/* Rename Dialog (Simple implementation) */}
      <Dialog open={!!renameId} onOpenChange={(open) => !open && setRenameId(null)}>
          <DialogContent className="bg-[#1e1e1e] border-white/10 text-white sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Rename Chat</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                  <input 
                    value={renameTitle}
                    onChange={(e) => setRenameTitle(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Chat Title"
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  />
              </div>
              <DialogFooter>
                  <Button onClick={handleRename} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </motion.div>
  );
}