/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { 
    Settings, HardDrive, Moon, Sun, Laptop, Trash2, 
    Brain, Cable, X, Plus, ChevronRight,
    UserCog
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { observer } from "mobx-react-lite";
import { chatStore } from "@/lib/store/chat-store";
import { integrationsStore } from "@/lib/store/integrations-store";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACCENT_COLORS = [
    { name: "Blue", value: "221.2 83.2% 53.3%", hex: "#3b82f6" },
    { name: "Violet", value: "262.1 83.3% 57.8%", hex: "#8b5cf6" },
    { name: "Pink", value: "330.4 81.2% 60.4%", hex: "#db2777" },
    { name: "Red", value: "0 84.2% 60.2%", hex: "#ef4444" },
    { name: "Orange", value: "24.6 95% 53.1%", hex: "#f97316" },
    { name: "Amber", value: "45.4 93.4% 47.5%", hex: "#f59e0b" },
    { name: "Green", value: "142.1 76.2% 36.3%", hex: "#16a34a" },
    { name: "Teal", value: "173.4 80.4% 40%", hex: "#0d9488" },
];

const CONNECTOR_ICONS: Record<string, { label: string, icon: React.ReactNode, color: string }> = {
    'gmail': { label: 'Gmail', icon: <div className="font-bold text-white text-xs">M</div>, color: 'bg-red-500' },
    'google_drive': { label: 'Google Drive', icon: <div className="font-bold text-white text-xs">G</div>, color: 'bg-green-500' },
    'notion': { label: 'Notion', icon: <div className="font-bold text-white text-xs">N</div>, color: 'bg-black dark:bg-neutral-700' },
    'slack': { label: 'Slack', icon: <div className="font-bold text-white text-xs">S</div>, color: 'bg-purple-500' },
};

const TONE_OPTIONS = [
    { value: "default", label: "Default", desc: "Preset style and tone" },
    { value: "professional", label: "Professional", desc: "Polished and precise" },
    { value: "friendly", label: "Friendly", desc: "Warm and chatty" },
    { value: "candid", label: "Candid", desc: "Direct and encouraging" },
    { value: "quirky", label: "Quirky", desc: "Playful and imaginative" },
    { value: "efficient", label: "Efficient", desc: "Concise and plain" },
    { value: "nerdy", label: "Nerdy", desc: "Exploratory and enthusiastic" },
    { value: "cynical", label: "Cynical", desc: "Critical and sarcastic" },
];

const CHARACTERISTIC_OPTIONS = [
    { value: "more", label: "More", desc: "Friendlier and more personable" },
    { value: "default", label: "Default", desc: "" },
    { value: "less", label: "Less", desc: "More professional and factual" },
];

export const SettingsDialog = observer(({ open, onOpenChange }: SettingsDialogProps) => {
  const { theme, setTheme } = useTheme();
  // Removed unused user hook
  const [accent, setAccent] = React.useState(ACCENT_COLORS[0]);
  const [activeTab, setActiveTab] = React.useState("general");
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

  // Load Accent
  React.useEffect(() => {
      const saved = localStorage.getItem('zod-accent');
      if (saved) {
          const found = ACCENT_COLORS.find(c => c.value === saved);
          if (found) {
              setAccent(found);
              document.documentElement.style.setProperty('--primary', found.value);
          }
      }
  }, []);

  // Apply Accent
  const handleAccentChange = (color: typeof ACCENT_COLORS[0]) => {
      setAccent(color);
      localStorage.setItem('zod-accent', color.value);
      document.documentElement.style.setProperty('--primary', color.value);
  };

  // Connectors
  React.useEffect(() => {
      if (open) {
          integrationsStore.loadConnectedIntegrations();
      }
  }, [open]);

  const getConnectorDisplay = (name: string) => {
      const key = name.toLowerCase();
      // Simple lookup or default
      return CONNECTOR_ICONS[key] || { 
          label: name.charAt(0).toUpperCase() + name.slice(1), 
          icon: <Cable className="text-white h-4 w-4" />, 
          color: 'bg-indigo-500' 
      };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] h-[600px] flex gap-0 p-0 overflow-hidden bg-[#f9f9f9] dark:bg-[#0c0c0c] border-none shadow-2xl sm:rounded-2xl ring-0 focus:outline-none">
        <div className="sr-only">
            <DialogTitle>Settings</DialogTitle>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-row overflow-hidden">
             
          {/* Sidebar */}
          <div className="w-[220px] bg-neutral-100/50 dark:bg-[#1E1E1E] flex flex-col py-2 space-y-6 shrink-0">
             {/* <div className="px-5 mb-2">
                 <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Settings</h2>
             </div> */}
             
             <TabsList className="flex flex-col h-auto space-y-1 bg-transparent p-0 w-full px-2">
                <TabsTrigger 
                    value="general" 
                    className="w-full justify-start gap-3 px-3 py-2 rounded-md transition-all text-neutral-500 dark:text-neutral-400 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white hover:bg-neutral-200/50 dark:hover:bg-[#353535] data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] data-[state=active]:shadow-sm"
                >
                    <Settings className="h-4 w-4" /> 
                    <span>General</span>
                </TabsTrigger>
                <TabsTrigger 
                    value="personalization" 
                    className="w-full justify-start gap-3 px-3 py-2 rounded-md transition-all text-neutral-500 dark:text-neutral-400 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white hover:bg-neutral-200/50 dark:hover:bg-[#353535] data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] data-[state=active]:shadow-sm"
                >
                    <UserCog className="h-4 w-4" /> 
                    <span>Personalization</span>
                </TabsTrigger>
                <TabsTrigger 
                    value="connectors" 
                    className="w-full justify-start gap-3 px-3 py-2 rounded-md transition-all text-neutral-500 dark:text-neutral-400 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white hover:bg-neutral-200/50 dark:hover:bg-[#353535] data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] data-[state=active]:shadow-sm"
                >
                    <Cable className="h-4 w-4" /> 
                    <span>Connectors</span>
                </TabsTrigger>
                <TabsTrigger 
                    value="data" 
                    className="w-full justify-start gap-3 px-3 py-2 rounded-md transition-all text-neutral-500 dark:text-neutral-400 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white hover:bg-neutral-200/50 dark:hover:bg-[#353535] data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] data-[state=active]:shadow-sm"
                >
                    <HardDrive className="h-4 w-4" /> 
                    <span>Data Controls</span>
                </TabsTrigger>
             </TabsList>
             
             {/* User Profile Removed as requested */}
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0c0c0c] overflow-hidden">
             
             {/* Header */}
             <div className="h-16 flex items-center justify-between px-8 shrink-0">
                 <h2 className="text-lg font-medium text-neutral-900 dark:text-white capitalize">
                     {activeTab === 'data' ? 'Data Controls' : activeTab}
                 </h2>
                 <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full h-8 w-8 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                     <X className="h-4 w-4" />
                 </Button>
             </div>

             <ScrollArea className="flex-1 px-8">
                <div className="max-w-2xl mx-auto space-y-10 pb-20 pt-2">
                    
                    {/* GENERAL TAB */}
                    <TabsContent value="general" className="mt-0 space-y-8 animate-in fade-in duration-300">
                        {/* Theme Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-normal">Theme</Label>
                                <div className="flex bg-neutral-100 dark:bg-neutral-800/50 rounded-lg p-0.5 border border-neutral-200 dark:border-neutral-800">
                                    {['System', 'Light', 'Dark'].map((t) => {
                                        const mode = t.toLowerCase();
                                        const isActive = theme === mode;
                                        return (
                                            <Button 
                                                key={mode}
                                                variant="ghost" 
                                                size="sm" 
                                                className={cn(
                                                    "h-7 px-3 rounded-md text-xs font-medium transition-all",
                                                    isActive 
                                                        ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm" 
                                                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                                                )}
                                                onClick={() => setTheme(mode)}
                                            >
                                                {t === 'System' && <Laptop className="h-3 w-3 mr-1.5" />}
                                                {t === 'Light' && <Sun className="h-3 w-3 mr-1.5" />}
                                                {t === 'Dark' && <Moon className="h-3 w-3 mr-1.5" />}
                                                {t}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-4">
                                <div className="space-y-1">
                                    <Label className="text-base font-normal">Accent Color</Label>
                                    <p className="text-xs text-neutral-500">Main brand color.</p>
                                </div>
                                <div className="flex gap-1.5">
                                        {ACCENT_COLORS.map((c) => (
                                            <button
                                                key={c.name}
                                                onClick={() => handleAccentChange(c)}
                                                className={cn(
                                                    "h-5 w-5 rounded-full ring-2 ring-offset-2 ring-offset-neutral-50 dark:ring-offset-[#0c0c0c] transition-all",
                                                    accent.value === c.value ? "ring-neutral-400 dark:ring-neutral-500 scale-110" : "ring-transparent hover:scale-105"
                                                )}
                                                style={{ backgroundColor: c.hex }}
                                                title={c.name}
                                            />
                                        ))}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* PERSONALIZATION TAB */}
                    <TabsContent value="personalization" className="mt-0 space-y-8 animate-in fade-in duration-300">
                        {/* Base style and tone */}
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-base font-medium">Base style and tone</h3>
                                    <p className="text-xs text-neutral-500 max-w-[350px]">Set the style and tone of how Zod responds to you. This doesn&apos;t impact Zod&apos;s capabilities.</p>
                                </div>
                                <Select 
                                    defaultValue={chatStore.baseStyle}
                                    onValueChange={(v) => chatStore.setBaseStyle(v)}
                                >
                                    <SelectTrigger className="w-[125px] dark:hover:bg-[#414141] h-10 rounded-2xl text-xs bg-transparent dark:bg-[#0c0c0c] dark:border-neutral-800">
                                        <SelectValue placeholder="Default" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {TONE_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="py-2.5">
                                                <div className="flex flex-col gap-0.5 text-left">
                                                    <span className="font-medium text-sm">{opt.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3 pt-2">
                                <h4 className="text-sm font-medium text-neutral-500">Characteristics</h4>
                                <p className="text-xs text-neutral-500">Choose additional customizations on top of your base style and tone.</p>
                                
                                {/* Characteristics Toggles */}
                                {[ "Warm", "Enthusiastic", "Headers & Lists", "Emoji" ].map(label => {
                                     // Create a key from label: "Headers & Lists" -> "headers_lists"
                                     const key = label.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
                                     const val = chatStore.characteristics[key] || "default";
                                     
                                     return (
                                     <div key={label} className="flex items-center justify-between">
                                        <Label className="font-normal text-sm text-neutral-700 dark:text-neutral-300">{label}</Label>
                                        <Select 
                                            value={val}
                                            onValueChange={(v) => chatStore.setCharacteristic(key, v)}
                                        >
                                            <SelectTrigger className="w-[120px] h-8 text-xs bg-transparent border-none shadow-none dark:text-neutral-400 justify-end px-0 gap-1 hover:text-white focus:ring-0">
                                                 <span className="mr-1">
                                                     {CHARACTERISTIC_OPTIONS.find(o => o.value === val)?.label}
                                                 </span>
                                             </SelectTrigger>
                                             <SelectContent align="end">
                                                {CHARACTERISTIC_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value} className="py-2">
                                                        <div className="flex flex-col gap-0.5 max-w-[180px]">
                                                            <span className="font-medium text-sm">{opt.label}</span>
                                                            {opt.desc && <span className="text-[10px] text-neutral-500 leading-tight">{opt.desc}</span>}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                             </SelectContent>
                                        </Select>
                                     </div>
                                     );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                             <Label className="text-base font-medium">Custom instructions</Label>
                             <Textarea
                                 placeholder="Additional behavior, style, and tone preferences"
                                 className="bg-transparent border-neutral-200 dark:border-neutral-800 min-h-[80px] text-sm resize-none focus-visible:ring-primary/20"
                                 value={chatStore.customInstructions}
                                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => chatStore.setCustomInstructions(e.target.value)}
                             />
                        </div>

                        {/* About you */}
                        <div className="space-y-4 pt-6">
                            <h3 className="text-lg font-medium">About you</h3>
                            <div className="space-y-4">
                                 <div className="space-y-2">
                                     <Label className="text-sm font-normal text-neutral-500">Nickname</Label>
                                     <Input 
                                        className="dark:bg-transparent dark:border-neutral-800" 
                                        placeholder="What should Zod call you?" 
                                        value={chatStore.aboutYou.nickname}
                                        onChange={(e) => chatStore.setAboutYou('nickname', e.target.value)}
                                     />
                                 </div>
                                 <div className="space-y-2">
                                     <Label className="text-sm font-normal text-neutral-500">Occupation</Label>
                                     <Input 
                                        className="dark:bg-transparent dark:border-neutral-800" 
                                        placeholder="Small-batch home sourdough baker"
                                        value={chatStore.aboutYou.occupation}
                                        onChange={(e) => chatStore.setAboutYou('occupation', e.target.value)}
                                     />
                                 </div>
                                 <div className="space-y-2">
                                     <Label className="text-sm font-normal text-neutral-500">More about you</Label>
                                     <Input 
                                        className="dark:bg-transparent dark:border-neutral-800" 
                                        placeholder="Interests, values, or preferences to keep in mind" 
                                        value={chatStore.aboutYou.bio}
                                        onChange={(e) => chatStore.setAboutYou('bio', e.target.value)}
                                     />
                                 </div>
                            </div>
                        </div>

                        {/* Memory */}
                         <div className="space-y-4 pt-6">
                            <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                     <h3 className="text-lg font-medium">Memory</h3>
                                 </div>
                                 <Button variant="outline" size="sm" className="h-7 text-xs rounded-full">Manage</Button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Reference saved memories</Label>
                                        <p className="text-xs text-neutral-500">Let Zod save and use memories when responding.</p>
                                    </div>
                                    <Switch checked={chatStore.memoryEnabled} onCheckedChange={chatStore.setMemoryEnabled} />
                                </div>
                                 <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Reference chat history</Label>
                                        <p className="text-xs text-neutral-500">Let Zod reference all previous conversations when responding.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </div>
                        </div>
                        
                         {/* Advanced Toggles - Collapsible */}
                         <div className="space-y-4 pt-6 pb-10">
                            <div 
                                className="flex items-center justify-between cursor-pointer group"
                                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                            >
                                <h3 className="text-base font-medium text-neutral-400 group-hover:text-neutral-200 transition-colors">Advanced</h3>
                                <ChevronRight className={cn("h-4 w-4 text-neutral-500 transition-transform duration-200", isAdvancedOpen && "rotate-90")} />
                            </div>
                            
                            {isAdvancedOpen && (
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                    {[
                                        { key: "webSearch", label: "Web search", desc: "Let Zod automatically search the web for answers." },
                                        { key: "codeInterpreter", label: "Code", desc: "Let Zod execute code using Code Interpreter." },
                                        { key: "canvas", label: "Canvas", desc: "Collaborate with Zod on text and code." },
                                        { key: "voice", label: "Zod Voice", desc: "Enable Voice in Zod" },
                                        { key: "advancedVoice", label: "Advanced voice", desc: "Have more natural conversations in Voice." },
                                        { key: "connectorSearch", label: "Connector search", desc: "Let Zod automatically search connected sources for answers." },
                                    ].map(item => (
                                        <div key={item.key} className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-medium">{item.label}</Label>
                                                <p className="text-xs text-neutral-500">{item.desc}</p>
                                            </div>
                                            <Switch 
                                                checked={(chatStore.advanced as any)[item.key]}
                                                onCheckedChange={(c) => chatStore.setAdvanced(item.key as any, c)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* CONNECTORS TAB */}
                    <TabsContent value="connectors" className="mt-0 space-y-8 animate-in fade-in duration-300">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <h3 className="text-base font-medium">Active Connectors</h3>
                                    <p className="text-xs text-neutral-500">Manage enabled Connectors you can use in your chats.</p>
                                </div>
                                <Button className="dark:hover:bg-[#353535] border border-neutral-200 dark:border-neutral-800 rounded-2xl" size="sm" onClick={() => {
                                    onOpenChange(false);
                                    chatStore.setIsActiveIntegrationOpen(true);
                                }}>
                                    <Plus className="h-3.5 w-3.5 mr-2" /> Add Connector
                                </Button>
                            </div>
                            
                            {integrationsStore.isLoading ? (
                                <div className="py-10 text-center text-neutral-500 text-sm">Loading connectors...</div>
                            ) : integrationsStore.connectedIntegrations.size === 0 ? (
                                <div className="py-10 text-center flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#0c0c0c]/50">
                                    <Cable className="h-8 w-8 text-neutral-400 mb-2" />
                                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">No connectors active</p>
                                    <p className="text-xs text-neutral-500 mt-1 max-w-xs">Connect tools like Google Drive, Notion, or Slack to give Zod superhuman capabilities.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {Array.from(integrationsStore.connectedIntegrations.values()).map(integration => {
                                        const display = getConnectorDisplay(integration.integrationName);
                                        return (
                                            <div key={integration.integrationName} className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c]">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-lg flex items-center justify-center shadow-sm",
                                                        display.color
                                                    )}>
                                                        {display.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium">{display.label}</h4>
                                                        <p className="text-xs text-neutral-500">Connected {new Date(integration.connectedAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-red-500 hover:text-red-600 border border-red-950 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10"
                                                    onClick={() => integrationsStore.disconnectIntegration(integration.integrationName)}
                                                >
                                                    Disconnect
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* DATA TAB */}
                    <TabsContent value="data" className="mt-0 space-y-8 animate-in fade-in duration-300">
                        <div className="space-y-4">
                            <h3 className="text-base font-medium">Privacy & Data</h3>
                            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0c0c0c] space-y-6">
                                <div className="flex items-center justify-between">
                                     <div className="space-y-0.5">
                                        <Label>Export Data</Label>
                                        <p className="text-xs text-neutral-500">Download all your chats and memories.</p>
                                     </div>
                                     <Button className="dark:hover:bg-[#353535] border border-neutral-200 dark:border-neutral-800 rounded-2xl" size="sm">Export All</Button>
                                </div>

                                <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 pt-6">
                                     <div className="space-y-0.5">
                                        <Label className="text-red-600">Delete Account</Label>
                                        <p className="text-xs text-red-500/70">Permanently remove all your data.</p>
                                     </div>
                                     <Button variant="destructive" size="sm" className="dark:hover:bg-[#353535] border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Account
                                     </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                </div>
             </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});
