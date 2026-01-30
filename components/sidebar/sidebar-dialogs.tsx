import * as React from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";

interface SidebarDialogsProps {
  deleteId: string | null;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  
  renameId: string | null;
  renameTitle: string;
  onRenameTitleChange: (title: string) => void;
  onCancelRename: () => void;
  onConfirmRename: () => void;
}

export function SidebarDialogs({
  deleteId,
  onCancelDelete,
  onConfirmDelete,
  renameId,
  renameTitle,
  onRenameTitleChange,
  onCancelRename,
  onConfirmRename
}: SidebarDialogsProps) {
  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && onCancelDelete()}>
          <DialogContent className="bg-[#1e1e1e] border-white/10 text-white sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Delete Chat?</DialogTitle>
                  <DialogDescription className="text-neutral-400">
                      This action cannot be undone. This will permanently delete the chat history.
                  </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:justify-end">
                  <Button variant="ghost" onClick={onCancelDelete} className="text-neutral-400 hover:text-white hover:bg-white/5">Cancel</Button>
                  <Button variant="destructive" onClick={onConfirmDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      {/* Rename Dialog */}
      <Dialog open={!!renameId} onOpenChange={(open) => !open && onCancelRename()}>
          <DialogContent className="bg-[#1e1e1e] border-white/10 text-white sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Rename Chat</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                  <input 
                    value={renameTitle}
                    onChange={(e) => onRenameTitleChange(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Chat Title"
                    onKeyDown={(e) => e.key === 'Enter' && onConfirmRename()}
                  />
              </div>
              <DialogFooter>
                  <Button onClick={onConfirmRename} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
