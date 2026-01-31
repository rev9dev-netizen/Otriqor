"use client";

import * as React from "react";
import { Settings, User, Shield, HardDrive, Moon, Sun, Laptop, Trash2, LogOut, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { observer } from "mobx-react-lite";
import { chatStore } from "@/lib/store/chat-store";
import { PERSONALITIES } from "@/lib/api/personalities";
import { updateUserPreferences } from "@/lib/supabase/db";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = observer(({ open, onOpenChange }: SettingsDialogProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col gap-0 p-0 overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
        <DialogHeader className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="hidden">Manage your preferences</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="flex-1 flex flex-row overflow-hidden">
             
          {/* Left Sidebar for Tabs */}
          <div className="w-[200px] bg-neutral-50 dark:bg-neutral-900/50 border-r border-neutral-200 dark:border-neutral-800 p-2 space-y-1">
             <TabsList className="bg-transparent flex flex-col h-auto space-y-1 p-0 justify-start w-full">
                <TabsTrigger value="general" className="w-full justify-start gap-2 px-3 py-2 data-[state=active]:bg-neutral-200 dark:data-[state=active]:bg-neutral-800">
                    <Settings className="h-4 w-4" /> General
                </TabsTrigger>
                <TabsTrigger value="personalization" className="w-full justify-start gap-2 px-3 py-2 data-[state=active]:bg-neutral-200 dark:data-[state=active]:bg-neutral-800">
                    <User className="h-4 w-4" /> Personalization
                </TabsTrigger>
                <TabsTrigger value="data" className="w-full justify-start gap-2 px-3 py-2 data-[state=active]:bg-neutral-200 dark:data-[state=active]:bg-neutral-800">
                    <HardDrive className="h-4 w-4" /> Data Controls
                </TabsTrigger>
                <TabsTrigger value="security" className="w-full justify-start gap-2 px-3 py-2 data-[state=active]:bg-neutral-200 dark:data-[state=active]:bg-neutral-800">
                    <Shield className="h-4 w-4" /> Security
                </TabsTrigger>
             </TabsList>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
             
             {/* GENERAL TAB */}
             <TabsContent value="general" className="mt-0 space-y-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Theme</h3>
                    <div className="flex items-center justify-between">
                        <Label>App Theme</Label>
                        <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                            <Button 
                                variant="ghost" size="sm" 
                                className={cn("h-7 px-2", theme === 'system' && "bg-white dark:bg-neutral-700 shadow-sm")}
                                onClick={() => setTheme("system")}
                            >
                                <Laptop className="h-4 w-4 mr-1" /> System
                            </Button>
                            <Button 
                                variant="ghost" size="sm" 
                                className={cn("h-7 px-2", theme === 'light' && "bg-white dark:bg-neutral-700 shadow-sm")}
                                onClick={() => setTheme("light")}
                            >
                                <Sun className="h-4 w-4 mr-1" /> Light
                            </Button>
                            <Button 
                                variant="ghost" size="sm" 
                                className={cn("h-7 px-2", theme === 'dark' && "bg-white dark:bg-neutral-700 shadow-sm")}
                                onClick={() => setTheme("dark")}
                            >
                                <Moon className="h-4 w-4 mr-1" /> Dark
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Always show code when writing</Label>
                            <p className="text-xs text-neutral-500">Enable verbose code blocks.</p>
                        </div>
                        <Switch />
                     </div>
                </div>
             </TabsContent>

             {/* PERSONALIZATION TAB */}
             <TabsContent value="personalization" className="mt-0 space-y-6">
                 <div>
                    <h3 className="text-lg font-medium mb-4">AI Personality</h3>
                    <p className="text-sm text-neutral-500 mb-4">Choose the persona and tone for the AI assistant.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PERSONALITIES.map((p) => {
                            const isSelected = chatStore.personality.id === p.id;
                            return (
                                <div 
                                    key={p.id}
                                    onClick={() => {
                                        chatStore.setPersonality(p);
                                        updateUserPreferences({ personalityId: p.id }).catch(console.error);
                                    }}
                                    className={cn(
                                        "relative flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                                        isSelected 
                                            ? "border-primary bg-primary/5 dark:bg-primary/10" 
                                            : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900"
                                    )}
                                >
                                    <div className="text-2xl pt-0.5">{p.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn("font-medium text-sm", isSelected ? "text-primary" : "text-neutral-900 dark:text-neutral-100")}>
                                                {p.name}
                                            </span>
                                            {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                                        </div>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                            {p.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 </div>
             </TabsContent>

             {/* DATA CONTROLS */}
             <TabsContent value="data" className="mt-0 space-y-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Data Export</h3>
                    <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                            <Label>Export Data</Label>
                            <p className="text-xs text-neutral-500">Receive an email with all your conversation history.</p>
                         </div>
                         <Button variant="outline">Export</Button>
                    </div>

                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center justify-between text-red-600">
                             <div className="space-y-0.5">
                                <Label className="text-red-500">Delete Account</Label>
                                <p className="text-xs text-red-400">Permanently delete your account and all data.</p>
                             </div>
                             <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                             </Button>
                        </div>
                    </div>
                </div>
             </TabsContent>

              {/* SECURITY */}
              <TabsContent value="security" className="mt-0 space-y-6">
                  <div className="space-y-4">
                      <h3 className="text-lg font-medium">Multi-Factor Authentication</h3>
                      <div className="flex items-center justify-between">
                           <div className="space-y-0.5">
                              <Label>Require 2FA</Label>
                              <p className="text-xs text-neutral-500">Add an extra layer of security to your account.</p>
                           </div>
                           <Button variant="outline" disabled>Enable (Coming Soon)</Button>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4">
                           <div className="space-y-0.5">
                              <Label>Log out of all devices</Label>
                              <p className="text-xs text-neutral-500">End sessions on all other browsers.</p>
                           </div>
                           <Button variant="outline">
                               <LogOut className="h-4 w-4 mr-2" /> Log out all
                           </Button>
                      </div>
                  </div>
              </TabsContent>

          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});
