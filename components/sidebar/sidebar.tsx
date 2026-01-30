/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SettingsDialog } from "@/components/profile/settings-dialog";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { deleteChat, updateChat } from "@/lib/supabase/db";
import { Search, ChevronLeft } from "lucide-react";

// Sub-components
import { SidebarRail } from "./sidebar-rail";
import { ChatHistoryList } from "./chat-history-list";
import { SidebarDialogs } from "./sidebar-dialogs";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ className, isOpen, onToggle }: SidebarProps) {
  const router = useRouter(); 
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [chats, setChats] = React.useState<any[]>([]);
  const { user: currentUser } = useAuth();
  
  // Dialog State
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [renameId, setRenameId] = React.useState<string | null>(null);
  const [renameTitle, setRenameTitle] = React.useState("");
  
  // Active Chat Logic
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
          await deleteChat(deleteId);
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

  const activeDialogs = (
      <SidebarDialogs 
          deleteId={deleteId}
          onCancelDelete={() => setDeleteId(null)}
          onConfirmDelete={handleDelete}
          renameId={renameId}
          renameTitle={renameTitle}
          onRenameTitleChange={setRenameTitle}
          onCancelRename={() => setRenameId(null)}
          onConfirmRename={handleRename}
      />
  );

  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? "340px" : "60px" }} 
      className={cn(
        "flex h-full border-r z-50 overflow-visible select-none group/sidebar", /* Changed hidden to visible for the button to poke out if needed, added group/sidebar */
        "bg-[#121212] border-white/5 shadow-2xl", 
        className
      )}
    >
      {/* 1. Icon Rail (Always Visible) */}
      <SidebarRail 
          onToggle={onToggle} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
      />

      {/* 2. Detail Panel */}
      <AnimatePresence>
      {isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col bg-[#121212] min-w-0 relative" 
          >
             {/* Panel Header */}
             <div className="p-5 flex items-center justify-between">
                 <h2 className="text-lg font-semibold text-white tracking-tight">Chats</h2>
                 <Search className="h-4 w-4 text-neutral-500" />
             </div>
             
             <ChatHistoryList 
                 chats={chats}
                 activeChatId={activeChatId}
                 onRename={(id, title) => {
                     setRenameId(id);
                     setRenameTitle(title);
                 }}
                 onDelete={setDeleteId}
                 onPin={async (chat) => {
                     await updateChat(chat.id, { is_pinned: !chat.is_pinned });
                 }}
                 onArchive={async (chat) => {
                     await updateChat(chat.id, { is_archived: !chat.is_archived });
                 }}
             />

             <div className="h-4" />
             
             {/* Collapse Arrow - Visible on Hover */}
             <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-50 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                <button 
                  onClick={onToggle}
                  className="bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
             </div>
          </motion.div>
      )}
      </AnimatePresence>

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      {activeDialogs}

    </motion.div>
  );
}
