/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Search, Plus, AlertCircle, Eye, Brain, Globe, Box, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { providers, Model } from "@/lib/config/models";

// Mock Data for initial structure
const PROVIDER_LIST = [
  { id: "mistral", name: "Mistral AI", icon: providers.mistral.logo, enabled: true },
  { id: "openai", name: "OpenAI", icon: providers.openai.logo, enabled: false },
  { id: "anthropic", name: "Anthropic", icon: providers.anthropic.logo, enabled: false },
  { id: "google", name: "Google Gemini", icon: providers.gemini.logo, enabled: false },
];

export function ProviderSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [selectedProviderId, setSelectedProviderId] = React.useState("mistral");
  const [apiKey, setApiKey] = React.useState("");
  const [fetchedModels, setFetchedModels] = React.useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = React.useState(false);
  const [disabledModelIds, setDisabledModelIds] = React.useState<Set<string>>(new Set());

  // Current view state
  const selectedProvider = PROVIDER_LIST.find(p => p.id === selectedProviderId) || PROVIDER_LIST[0];

  const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
          const res = await fetch("/api/models");
          if (res.ok) {
              const data = await res.json();
              setFetchedModels(data.models);
          }
      } catch (e) {
          console.error("Failed to fetch models", e);
      } finally {
          setIsLoadingModels(false);
      }
  };

  // Filter models for selected provider
  const providerModels = fetchedModels.filter(m => m.provider === selectedProviderId);
  
  // Toggle Logic
  const toggleModel = (id: string) => {
      const newSet = new Set(disabledModelIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setDisabledModelIds(newSet);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1000px] w-full h-[80vh] p-0 bg-[#0a0a0a] border-white/10 text-white overflow-hidden flex flex-col md:flex-row gap-0">
        
        {/* LEFT SIDEBAR: Provider List */}
        <div className="w-[280px] bg-[#121212] border-r border-white/5 flex flex-col">
           {/* Header */}
           <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                  <input 
                      placeholder="Search Providers..." 
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-white/10 placeholder:text-neutral-600"
                  />
              </div>
              <button className="ml-2 p-1.5 hover:bg-white/5 rounded-md text-neutral-400 hover:text-white">
                  <Plus className="h-4 w-4" />
              </button>
           </div>

           {/* List */}
           <ScrollArea className="flex-1">
               <div className="p-2 space-y-4">
                   {/* Enabled Section */}
                   <div>
                       <div className="px-3 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center justify-between">
                           <span>Enabled</span>
                           <span className="bg-white/5 text-neutral-400 px-1.5 rounded-full">{PROVIDER_LIST.filter(p => p.enabled).length}</span>
                       </div>
                       <div className="space-y-0.5">
                           {PROVIDER_LIST.filter(p => p.enabled).map(provider => (
                               <button
                                   key={provider.id}
                                   onClick={() => setSelectedProviderId(provider.id)}
                                   className={cn(
                                       "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group",
                                       selectedProviderId === provider.id 
                                          ? "bg-purple-500/10 text-white" 
                                          : "text-neutral-400 hover:bg-white/5 hover:text-white"
                                   )}
                               >
                                   <div className="flex items-center gap-3">
                                       <img src={provider.icon} alt={provider.name} className="h-5 w-5 object-contain opacity-80" />
                                       <span className="font-medium">{provider.name}</span>
                                   </div>
                                   {selectedProviderId === provider.id && <div className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />}
                               </button>
                           ))}
                       </div>
                   </div>

                   {/* Disabled Section */}
                   <div>
                        <div className="px-3 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center justify-between">
                           <span>Disabled</span>
                        </div>
                        <div className="space-y-0.5">
                           {PROVIDER_LIST.filter(p => !p.enabled).map(provider => (
                               <button
                                   key={provider.id}
                                   onClick={() => setSelectedProviderId(provider.id)}
                                   className={cn(
                                       "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group",
                                       selectedProviderId === provider.id 
                                          ? "bg-white/10 text-white" 
                                          : "text-neutral-500 hover:bg-white/5 hover:text-white"
                                   )}
                               >
                                   <div className="flex items-center gap-3">
                                       <img src={provider.icon} alt={provider.name} className="h-5 w-5 object-contain opacity-50 grayscale group-hover:grayscale-0 transition-all" />
                                       <span className="font-medium">{provider.name}</span>
                                   </div>
                               </button>
                           ))}
                       </div>
                   </div>
               </div>
           </ScrollArea>
        </div>

        {/* RIGHT CONTENT: Details */}
        <div className="flex-1 bg-[#0a0a0a] flex flex-col min-w-0">
             {/* Header */}
             <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0a0a]">
                 <div className="flex items-center gap-4">
                     <div className="h-8 w-8 rounded-lg bg-white p-1.5">
                         <img src={selectedProvider.icon} alt={selectedProvider.name} className="h-full w-full object-contain" />
                     </div>
                     <div>
                         <div className="flex items-center gap-2">
                             <h2 className="text-lg font-bold text-white tracking-tight">{selectedProvider.name}</h2>
                             <a href="#" className="text-neutral-500 hover:text-neutral-300 transition-colors">
                                 <AlertCircle className="h-3.5 w-3.5" />
                             </a>
                         </div>
                     </div>
                 </div>
                 <Switch checked={selectedProvider.enabled} />
             </div>

             {/* Content Scroll */}
             <ScrollArea className="flex-1">
                 <div className="p-8 max-w-4xl mx-auto space-y-10">
                     
                     {/* 1. Configuration Section */}
                     <div className="space-y-6">
                         <div className="space-y-4">
                             <div className="flex flex-col gap-2">
                                 <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">API Key</label>
                                 <div className="relative">
                                     <Input 
                                         type="password"
                                         placeholder={`Enter your ${selectedProvider.name} API Key`} 
                                         className="bg-[#121212] border-white/10 focus:border-white/20 text-white pr-10 h-10 font-mono text-sm"
                                         value={apiKey}
                                         onChange={(e) => setApiKey(e.target.value)}
                                     />
                                     <Button size="icon" variant="ghost" className="absolute right-1 top-1 h-8 w-8 text-neutral-500 hover:text-white">
                                         <Eye className="h-4 w-4" />
                                     </Button>
                                 </div>
                                 <p className="text-[11px] text-neutral-500">
                                     Your key is encrypted using AES-GCM and stored locally.
                                 </p>
                             </div>

                             {/* Connectivity Check */}
                             <div className="flex items-end justify-between border-t border-white/5 pt-4">
                                  <div className="space-y-1">
                                      <div className="text-sm font-medium text-white">Connectivity Check</div>
                                      <div className="text-xs text-neutral-500">Test if your API key is working correctly.</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <select className="bg-[#121212] border border-white/10 rounded-md text-xs h-8 px-2 text-white outline-none">
                                          <option>Select model to test...</option>
                                      </select>
                                      <Button size="sm" variant="outline" className="h-8 bg-white/5 border-white/10 hover:bg-white/10 text-white">
                                          Check
                                      </Button>
                                  </div>
                             </div>
                         </div>
                     </div>

                     {/* 2. Model List Section */}
                     <div className="space-y-4">
                         <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <h3 className="text-sm font-bold text-white">Model List</h3>
                                 <span className="text-xs text-neutral-500">{providerModels.length} models available</span>
                             </div>
                             <div className="flex items-center gap-2">
                                  <div className="relative">
                                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                                      <input 
                                          placeholder="Search Models..." 
                                          className="bg-[#121212] border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-white/20 w-48"
                                      />
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={fetchModels}
                                    disabled={isLoadingModels}
                                    className="h-8 px-2 text-neutral-400 hover:text-white border border-transparent hover:border-white/10 hover:bg-white/5"
                                  >
                                      <RefreshCw className={cn("h-3.5 w-3.5 mr-2", isLoadingModels && "animate-spin")} /> 
                                      {isLoadingModels ? "Fetching..." : "Fetch models"}
                                  </Button>
                             </div>
                         </div>

                         {/* Tabs/Filter */}
                         <div className="flex items-center gap-6 border-b border-white/5 text-sm">
                             <button className="pb-2 text-white border-b-2 border-white font-medium">All ({providerModels.length})</button>
                             <button className="pb-2 text-neutral-500 hover:text-white transition-colors">Chat</button>
                             <button className="pb-2 text-neutral-500 hover:text-white transition-colors">Vision</button>
                             <button className="pb-2 text-neutral-500 hover:text-white transition-colors">Code</button>
                         </div>

                         {/* Model List */}
                         <div className="space-y-1">
                             {providerModels.length === 0 ? (
                                 <div className="bg-[#121212] rounded-xl border border-white/5 p-8 flex flex-col items-center justify-center text-center gap-2">
                                     <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 mb-2">
                                         <Box className="h-5 w-5" />
                                     </div>
                                     <p className="text-sm text-neutral-300">No models found</p>
                                     <p className="text-xs text-neutral-500 max-w-xs">Enter your API key and click &quot;Fetch models&quot; to see available models.</p>
                                 </div>
                             ) : (
                                 providerModels.map((model) => (
                                     <div key={model.id} className="flex items-center justify-between p-4 bg-[#121212] border border-white/5 rounded-xl hover:border-white/10 transition-all group">
                                         <div className="flex items-center gap-4">
                                             <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                                 <img src={providers[model.provider].logo} alt={model.name} className="h-6 w-6 object-contain" />
                                             </div>
                                             <div>
                                                 <div className="flex items-center gap-2">
                                                     <div className="font-semibold text-white text-sm">{model.name}</div>
                                                     <div className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-neutral-400 font-mono">
                                                         {model.id}
                                                     </div>
                                                 </div>
                                                 <div className="text-xs text-neutral-500 mt-1 flex items-center gap-3">
                                                      <span>Released at 2024-01-01</span> {/* Mock Date */}
                                                      <span className="text-neutral-700">|</span>
                                                      <span>In $0.00 / Out $0.00</span> {/* Mock Price */}
                                                 </div>
                                             </div>
                                         </div>
                                         
                                         <div className="flex items-center gap-6">
                                              {/* Caps */}
                                              <div className="flex items-center gap-2">
                                                  {model.capabilities.vision && <div className="p-1.5 rounded bg-green-500/10 text-green-500 border border-green-500/20"><Eye className="h-3.5 w-3.5" /></div>}
                                                  {model.capabilities.thinking && <div className="p-1.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20"><Brain className="h-3.5 w-3.5" /></div>}
                                                  {model.capabilities.webSearch && <div className="p-1.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20"><Globe className="h-3.5 w-3.5" /></div>}
                                                  {model.capabilities.functionCall && <div className="p-1.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20"><Box className="h-3.5 w-3.5" /></div>}
                                              </div>
                                              
                                              <div className="h-8 w-px bg-white/5" />

                                              <div className="text-xs font-mono text-neutral-400 w-16 text-right">
                                                  {Math.round(model.maxTokens / 1000)}K
                                              </div>

                                              <Switch 
                                                checked={!disabledModelIds.has(model.id)}
                                                onCheckedChange={() => toggleModel(model.id)}
                                              />
                                         </div>
                                     </div>
                                 ))
                             )}
                         </div>
                     </div>

                 </div>
             </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
