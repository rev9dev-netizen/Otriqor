"use client"

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, Plus, AlertCircle, Eye, Brain, Globe, Box, RefreshCw, Sparkles, Terminal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { providers, Model } from "@/lib/config/models";
import { toast } from "sonner";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useProviderLogos } from "@/hooks/use-provider-logos";
import { ModelConfigDialog } from "./model-config-dialog";

// Helper for initial provider list - dynamic from config
const ALL_PROVIDERS = Object.entries(providers).map(([id, data]) => ({
  id, 
  name: data.name, 
  icon: data.logo 
}));

type Tab = "all" | "chat" | "vision" | "code";

export function ProviderSettings() {
  const [selectedProviderId, setSelectedProviderId] = React.useState("mistral");
  const [fetchedModels, setFetchedModels] = React.useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = React.useState(false);
  const [enabledModelIds, setEnabledModelIds] = React.useState<Set<string>>(new Set());
  const [enabledProviderIds, setEnabledProviderIds] = React.useState<Set<string>>(new Set(["mistral"])); // Default Mistral enabled
  const [activeTab, setActiveTab] = React.useState<Tab>("all");
  const [testModelId, setTestModelId] = React.useState<string>("");

  // Dynamic Logos Hook
  const { getLogo } = useProviderLogos();

  // State for overrides
  const [modelOverrides, setModelOverrides] = React.useState<Record<string, Partial<Model>>>({});
  const [editingModel, setEditingModel] = React.useState<Model | null>(null);
  const [isConfigOpen, setIsConfigOpen] = React.useState(false);

  // Load persistence
  React.useEffect(() => {
      try {
          const savedProviders = localStorage.getItem("enabled_providers");
          if (savedProviders) {
              setEnabledProviderIds(new Set(JSON.parse(savedProviders)));
          } else {
              // Initial default if nothing saved: Mistral only
              setEnabledProviderIds(new Set(["mistral"]));
          }

          const savedOverrides = localStorage.getItem("model_overrides");
          if (savedOverrides) {
              setModelOverrides(JSON.parse(savedOverrides));
          }
      } catch(e) { console.error("Failed to parse settings", e); }
  }, []);

  // Save persistence
  const updateEnabledModels = (newSet: Set<string>) => {
      setEnabledModelIds(newSet);
      localStorage.setItem("enabled_models", JSON.stringify(Array.from(newSet)));
  };

  const updateEnabledProviders = (newSet: Set<string>) => {
      setEnabledProviderIds(newSet);
      localStorage.setItem("enabled_providers", JSON.stringify(Array.from(newSet)));
  };

  const handleSaveModelConfig = (id: string, updates: Partial<Model>) => {
     const newOverrides = {
         ...modelOverrides,
         [id]: updates
     };
     setModelOverrides(newOverrides);
     localStorage.setItem("model_overrides", JSON.stringify(newOverrides));
     toast.success("Model configuration saved");
  };

  const toggleProvider = (id: string) => {
      const newSet = new Set(enabledProviderIds);
      let isEnabling = false;
      if (newSet.has(id)) {
          if (newSet.size > 1) {
              newSet.delete(id);
              isEnabling = false;
          } else {
              toast.error("Cannot disable all providers", {
                  description: "At least one provider must be enabled."
              });
              return; 
          }
      } else {
          newSet.add(id);
          isEnabling = true;
      }
      updateEnabledProviders(newSet);
      toast.success(isEnabling ? "Provider Enabled" : "Provider Disabled", {
          description: `${isEnabling ? "Enabled" : "Disabled"} ${ALL_PROVIDERS.find(p => p.id === id)?.name || id}. Settings saved.`
      });
  };

  // Current view state
  const selectedProvider = ALL_PROVIDERS.find(p => p.id === selectedProviderId) || ALL_PROVIDERS[0];
  const isSelectedProviderEnabled = enabledProviderIds.has(selectedProvider.id);

  const fetchModels = React.useCallback(async () => {
      setIsLoadingModels(true);
      try {
          const res = await fetch("/api/models");
          if (res.ok) {
              const data = await res.json();
              // Deduplicate
              const uniqueModels = new Map<string, Model>();
              data.models.forEach((m: Model) => {
                  if (!uniqueModels.has(m.id)) {
                      uniqueModels.set(m.id, m);
                  }
              });
              
              const modelsList = Array.from(uniqueModels.values());
              setFetchedModels(modelsList); 

              // WHITELIST LOGIC:
              // 1. Try load "enabled_models"
              const savedEnabled = localStorage.getItem("enabled_models");
              
              if (savedEnabled) {
                  setEnabledModelIds(new Set(JSON.parse(savedEnabled)));
              } else {
                  // 2. MIGRATION: Check if "disabled_models" exists
                  const savedDisabled = localStorage.getItem("disabled_models");
                  if (savedDisabled) {
                      const disabledSet = new Set(JSON.parse(savedDisabled));
                      // Invert: Enabled = All Fetched - Disabled
                      const enabledSet = new Set<string>();
                      modelsList.forEach(m => {
                          if (!disabledSet.has(m.id)) {
                              enabledSet.add(m.id);
                          }
                      });
                      updateEnabledModels(enabledSet);
                      localStorage.removeItem("disabled_models"); // Cleanup
                      toast.info("Migrated settings", { description: "Converted model blocklist to allowlist." });
                  } else {
                      // 3. FRESH START: Default Enable "latest" only
                      const toEnable = new Set<string>();
                      const providers = new Set(modelsList.map(m => m.provider));
                      
                      providers.forEach(p => {
                          const pModels = modelsList.filter(m => m.provider === p);
                          if (pModels.length > 0) {
                              // Find "latest" or default to first
                              const bestModel = pModels.find(m => m.id.toLowerCase().includes('latest')) || pModels[0];
                              toEnable.add(bestModel.id);
                          }
                      });
                      
                      updateEnabledModels(toEnable);
                      toast.info("Applied default model settings", {
                          description: "Only key models are enabled by default."
                      });
                  }
              }
          }
      } catch (e) {
          console.error("Failed to fetch models", e);
          toast.error("Failed to fetch models");
      } finally {
          setIsLoadingModels(false);
      }
  }, []); // Dependencies are stable or refs

  // Auto-fetch models when provider changes
  React.useEffect(() => {
      fetchModels();
  }, [selectedProviderId, fetchModels]);

  // Filter models for selected provider logic
  const providerModels = React.useMemo(() => {
     // 1. Apply Overrides FIRST
     const effectiveModels = fetchedModels.map(m => {
         const override = modelOverrides[m.id];
         if (override) {
             return { ...m, ...override };
         }
         return m;
     });

     let filtered = effectiveModels.filter(m => m.provider === selectedProviderId);
     
     if (activeTab === "chat") filtered = filtered.filter(m => !m.capabilities.vision && !m.capabilities.functionCall && m.type !== 'image'); 
     if (activeTab === "vision") filtered = filtered.filter(m => m.capabilities.vision);
     if (activeTab === "code") filtered = filtered.filter(m => m.description.toLowerCase().includes("code") || m.name.toLowerCase().includes("code") || m.capabilities.functionCall); 
     
     return filtered;
  }, [fetchedModels, selectedProviderId, activeTab, modelOverrides]);
  
  // Toggle Logic
  const toggleModel = (id: string, name: string) => {
      const newSet = new Set(enabledModelIds);
      let isEnabling = false;
      if (newSet.has(id)) {
          newSet.delete(id);
          isEnabling = false;
      } else {
          newSet.add(id);
          isEnabling = true;
      }
      updateEnabledModels(newSet);
      toast.success(isEnabling ? "Model Enabled" : "Model Disabled", {
          description: `${isEnabling ? "Enabled" : "Disabled"} ${name}.`
      });
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#0a0a0a] text-white overflow-hidden">
        
        {/* LEFT SIDEBAR: Provider List */}
        <div className="w-[280px] bg-[#0f0f0f] border-r border-white/5 flex flex-col">
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
                           <span className="bg-white/5 text-neutral-400 px-1.5 rounded-full">{ALL_PROVIDERS.filter(p => enabledProviderIds.has(p.id)).length}</span>
                       </div>
                       <div className="space-y-0.5">
                           {ALL_PROVIDERS.filter(p => enabledProviderIds.has(p.id)).map(provider => (
                               <button
                                   key={provider.id}
                                   onClick={() => { setSelectedProviderId(provider.id); setTestModelId(""); }}
                                   className={cn(
                                       "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group",
                                       selectedProviderId === provider.id 
                                          ? "bg-purple-500/10 text-white" 
                                          : "text-neutral-400 hover:bg-white/5 hover:text-white"
                                   )}
                               >
                                   <div className="flex items-center gap-3">
                                       <img src={getLogo(provider.id, provider.icon)} alt={provider.name} className="h-5 w-5 object-contain opacity-80" />
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
                           {ALL_PROVIDERS.filter(p => !enabledProviderIds.has(p.id)).map(provider => (
                               <button
                                   key={provider.id}
                                   onClick={() => { setSelectedProviderId(provider.id); setTestModelId(""); }}
                                   className={cn(
                                       "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group",
                                       selectedProviderId === provider.id 
                                          ? "bg-white/10 text-white" 
                                          : "text-neutral-500 hover:bg-white/5 hover:text-white"
                                   )}
                               >
                                   <div className="flex items-center gap-3">
                                       <img src={getLogo(provider.id, provider.icon)} alt={provider.name} className="h-5 w-5 object-contain opacity-50 grayscale group-hover:grayscale-0 transition-all" />
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
                         <img src={getLogo(selectedProvider.id, selectedProvider.icon)} alt={selectedProvider.name} className="h-full w-full object-contain" />
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
             </div>

             {/* Content Scroll */}
             <ScrollArea className="flex-1">
                 <div className="p-8 max-w-4xl mx-auto space-y-10">
                     
                     {/* 1. Configuration Section */}
                     <div className="space-y-6">
                         <div className="space-y-4">
                              <div className="flex items-center justify-between py-1">
                                  <div className="flex flex-col gap-1">
                                      <span className="text-sm font-medium text-white">Enable {selectedProvider.name}</span>
                                      <span className="text-xs text-neutral-500">Allow using models from this provider in chat.</span>
                                  </div>
                                  <Switch 
                                      checked={isSelectedProviderEnabled} 
                                      onCheckedChange={() => toggleProvider(selectedProvider.id)}
                                  />
                              </div>

                             {/* Connectivity Check */}
                             <div className="flex items-end justify-between border-t border-white/5 pt-4">
                                  <div className="space-y-1">
                                      <div className="text-sm font-medium text-white">Connectivity Check</div>
                                      <div className="text-xs text-neutral-500">Test if your API key is working correctly.</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Select value={testModelId} onValueChange={setTestModelId}>
                                          <SelectTrigger className="w-[200px] h-8 text-xs bg-[#121212] border-white/10 text-white">
                                              <SelectValue placeholder="Select model to test..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                              {providerModels.map(m => (
                                                  <SelectItem key={m.id} value={m.id} className="text-xs">
                                                      {m.name}
                                                  </SelectItem>
                                              ))}
                                          </SelectContent>
                                      </Select>
                                      
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
                                 <span className="text-xs text-neutral-500">{providerModels.length} models avaiable</span>
                             </div>
                             <div className="flex items-center gap-2">
                                  <div className="relative">
                                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                                      <input 
                                          placeholder="Search Models..." 
                                          className="bg-[#121212] border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xl text-white focus:outline-none focus:border-white/20 w-48"
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
                             {([
                                 { id: 'all', label: `All (${fetchedModels.filter(m => m.provider === selectedProviderId).length})` },
                                 { id: 'chat', label: 'Chat' },
                                 { id: 'vision', label: 'Vision' },
                                 { id: 'code', label: 'Code' }
                             ] as const).map(tab => (
                                 <button
                                     key={tab.id}
                                     onClick={() => setActiveTab(tab.id as Tab)}
                                     className={cn(
                                         "pb-2 transition-colors",
                                         activeTab === tab.id 
                                            ? "text-white border-b-2 border-white font-medium" 
                                            : "text-neutral-500 hover:text-white"
                                     )}
                                 >
                                     {tab.label}
                                 </button>
                             ))}
                         </div>

                         {/* Model List */}
                         <div className="space-y-1">
                             {providerModels.length === 0 ? (
                                 <div className="bg-[#121212] rounded-xl border border-white/5 p-8 flex flex-col items-center justify-center text-center gap-2">
                                     <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 mb-2">
                                         <Box className="h-5 w-5" />
                                     </div>
                                     <p className="text-sm text-neutral-300">No models found</p>
                                     <p className="text-xs text-neutral-500 max-w-xs">Click &quot;Fetch models&quot; to see available models from {selectedProvider.name}.</p>
                                 </div>
                             ) : (
                                 providerModels.map((model) => (
                                     <div key={model.id} className="flex items-center justify-between p-4 bg-[#121212] border border-white/5 rounded-xl hover:border-white/10 transition-all group">
                                         <div className="flex items-center gap-4">
                                             <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                                 <img src={getLogo(model.provider, providers[model.provider]?.logo)} alt={model.name} className="h-6 w-6 object-contain" />
                                             </div>
                                             <div>
                                                 <div className="flex items-center gap-2">
                                                     <div className="font-semibold text-white text-sm">{model.name}</div>
                                                     {/* <div className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-neutral-400 font-mono">
                                                         {model.id}
                                                     </div> */}
                                                 </div>
                                                 {/* <div className="flex items-center gap-2 mt-1.5 h-4">
                                                      <div className="flex items-center text-xs text-neutral-500 font-medium">
                                                          <span>Input <span className="text-neutral-300 ml-0.5">${model.cost?.input || 0}/M</span></span>
                                                          <span className="mx-2 text-neutral-700">·</span>
                                                          <span>Output <span className="text-neutral-300 ml-0.5">${model.cost?.output || 0}/M</span></span>
                                                      </div>
                                                  </div> */}
                                             </div>
                                         </div>
                                         
                                          <div className="flex items-center gap-6">
                                              {/* Caps */}
                                              <div className="flex items-center gap-2">
                                                  {model.capabilities.vision && (
                                                    <div className="p-1.5 rounded bg-green-500/10 text-green-500 border border-green-500/20 cursor-help" title="Visual Recognition">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </div>
                                                  )}
                                                  
                                                  {model.capabilities.thinking && !model.name.toLowerCase().includes('large') && (
                                                    <div className="p-1.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20 cursor-help" title="Deep Thinking">
                                                        <Brain className="h-3.5 w-3.5" />
                                                    </div>
                                                  )}

                                                  {model.capabilities.thinking && model.name.toLowerCase().includes('large') && (
                                                    <div className="p-1.5 rounded bg-pink-500/10 text-pink-500 border border-pink-500/20 cursor-help" title="Super Deep Thinking">
                                                        <Sparkles className="h-3.5 w-3.5" />
                                                    </div>
                                                  )}

                                                  {model.capabilities.webSearch && (
                                                    <div className="p-1.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 cursor-help" title="Web Search">
                                                        <Globe className="h-3.5 w-3.5" />
                                                    </div>
                                                  )}

                                                  {model.capabilities.functionCall && (
                                                    <div className="p-1.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20 cursor-help" title="Function Calling">
                                                        <Box className="h-3.5 w-3.5" />
                                                    </div>
                                                  )}

                                                  {/* Max Tokens Badge */}
                                                  <div className="p-1.5 rounded bg-neutral-800 text-neutral-400 border border-white/5 cursor-help flex items-center gap-1 font-mono text-[10px]" title="Maximum Tokens">
                                                      <Terminal className="h-3 w-3" />
                                                      {Math.round(model.maxTokens / 1000)}k
                                                  </div>
                                                  
                                                  {/* Edit Button */}
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditingModel(model);
                                                        setIsConfigOpen(true);
                                                    }}
                                                    className="h-7 w-7 rounded-full text-neutral-500 hover:text-white hover:bg-white/10"
                                                  >
                                                      <Pencil className="h-3.5 w-3.5" />
                                                  </Button>
                                              </div>
                                              
                                              <div className="h-8 w-px bg-white/5" />

                                              <Switch 
                                                checked={enabledModelIds.has(model.id)}
                                                onCheckedChange={() => toggleModel(model.id, model.name)}
                                              />
                                         </div>
                                     </div>
                                 ))
                             )}
                         </div>
                     </div>
                     
                     <ModelConfigDialog 
                        model={editingModel}
                        open={isConfigOpen}
                        onOpenChange={setIsConfigOpen}
                        onSave={handleSaveModelConfig}
                     />

                 </div>
             </ScrollArea>
        </div>
    </div>
  );
}
