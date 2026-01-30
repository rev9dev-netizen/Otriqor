import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Copy, Edit2, Pin, Archive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";

interface ChatHistoryListProps {
  chats: any[];
  activeChatId: string;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onPin: (chat: any) => void;
  onArchive: (chat: any) => void;
}

export function ChatHistoryList({ chats, activeChatId, onRename, onDelete, onPin, onArchive }: ChatHistoryListProps) {
  return (
     <ScrollArea className="flex-1 w-full overflow-hidden px-1">
         <div className="flex flex-col pb-2">
             {chats.map(chat => {
                 const isActive = activeChatId === chat.id;
                 return (
                     <div key={chat.id} className="relative group px-1 py-0.5">
                         <Link 
                            href={`/c/${chat.id}`}
                            className={cn(
                                "flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer w-full min-w-0 pr-8", 
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
                                     <DropdownMenuItem onClick={() => onRename(chat.id, chat.title)} className="gap-2 cursor-pointer py-2 focus:bg-white/10 focus:text-white">
                                         <Edit2 className="h-4 w-4" /> Rename
                                     </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => onPin(chat)} className="gap-2 cursor-pointer py-2 focus:bg-white/10 focus:text-white">
                                         <Pin className="h-4 w-4" /> {chat.is_pinned ? "Unpin" : "Pin"}
                                     </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => onArchive(chat)} className="gap-2 cursor-pointer py-2 focus:bg-white/10 focus:text-white">
                                         <Archive className="h-4 w-4" /> {chat.is_archived ? "Unarchive" : "Archive"}
                                     </DropdownMenuItem>
                                     <DropdownMenuSeparator className="bg-white/10" />
                                     <DropdownMenuItem onClick={() => onDelete(chat.id)} className="gap-2 text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer py-2">
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
  );
}
