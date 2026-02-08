/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { models, providers, Model } from "@/lib/config/models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown, Search, Check, Sparkles, CircleDashed } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useProviderLogos } from "@/hooks/use-provider-logos";

// Define Top Tier Models (Exact IDs) - REMOVED, using model.tier property

interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (modelId: string) => void;
  isTemp?: boolean;
  onTempChange?: (val: boolean) => void;
}

export function ModelSelector({ currentModel, onModelChange, isTemp, onTempChange }: ModelSelectorProps) {
  const [availableModels, setAvailableModels] = React.useState<Model[]>(models);
  const [searchQuery, setSearchQuery] = React.useState("");
  
  // Dynamic Logos Hook
  const { getLogo } = useProviderLogos();
  
  React.useEffect(() => {
    // Simplified Static Fetch
    // We trust models.ts is the single source of truth now.
    // Fetch API to get any potential metadata updates but DO NOT overwrite enabled status basically.
    async function fetchData() {
        try {
            const modelsRes = await fetch("/api/models");
            if (modelsRes.ok) {
                const data = await modelsRes.json();
                // Map API results to key updateable fields only if needed (e.g. status)
                // But for Reset Scope, we rely on static models.ts mainly.
                // We'll just set what we have from the API if it respects our config.
                
                // Actually, the API now returns the static models too (see model-service.ts update).
                // So we can just use the API result if we want, or fail safe to import.
                if (Array.isArray(data.models) && data.models.length > 0) {
                     setAvailableModels(data.models);
                }
            }
        } catch (e) {
            console.error("Failed to fetch models, using static fallback", e);
        }
    }
    fetchData();
  }, []);

  // Filter models
  const filteredModels = React.useMemo(() => {
     let list = availableModels.filter(m => {
        // 1. Core Check: Must be enabled in config
        // "All other models... Must remain disabled by config flag"
        if (!m.enabled) return false;

        return true;
     });

     // 2. Search Filter
     if (searchQuery.trim()) {
         const q = searchQuery.toLowerCase();
         list = list.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
     }
     
     return list;
  }, [availableModels, searchQuery]);

  const activeModel = availableModels.find((m) => m.id === currentModel) || models.find(m => m.enabled) || models[0];
  const activeProvider = providers[activeModel?.provider] || providers[models[0].provider];
  const activeLogo = activeProvider ? getLogo(activeModel.provider, activeProvider.logo) : "";

  // Split Logic
  const topTierModels = filteredModels.filter(m => m.tier === 'flagship');
  const otherModels = filteredModels.filter(m => m.tier !== 'flagship'); // Mode or others
  
  // If search is active, we show a flat list (filteredModels), ignoring the split
  const isSearching = searchQuery.trim().length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-base font-medium outline-none group max-w-[240px]">
          <div className="h-6 w-6 rounded-full flex items-center justify-center bg-white p-1 overflow-hidden border border-neutral-200 dark:border-neutral-700 shrink-0">
             <img src={activeLogo} alt={activeModel.name} className="h-full w-full object-contain" />
          </div>
          <span className="text-neutral-700 dark:text-neutral-200 truncate">
            {activeModel.name}
          </span>
          <ChevronDown className="h-4 w-4 text-neutral-500 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-[280px] bg-[#1a1a1a] border-neutral-800 p-0 shadow-2xl overflow-hidden rounded-xl text-neutral-200"
      >
        {/* Search Header */}
        <div className="p-2">
             <div className="relative">
                 <Search className="absolute left-1 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-500" />
                 <input 
                    className="w-full bg-neutral-900/50 rounded-md pl-8 pr-3 py-1.5 text-lg text-neutral-200 placeholder:text-neutral-600 focus:outline-none transition-colors"
                    placeholder="Search models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                 />
             </div>
        </div>

        <div className="py-1">
            {!isSearching ? (
                <>
                    {/* Top Tier Section */}
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-neutral-500">
                        Models
                    </div>
                    {topTierModels.map(model => (
                        <ModelItem 
                            key={model.id} 
                            model={model} 
                            isSelected={currentModel === model.id} 
                            onSelect={() => onModelChange(model.id)}
                            getLogo={getLogo}
                        />
                    ))}

                    {topTierModels.length === 0 && (
                         <div className="px-4 py-2 text-xs text-neutral-500 italic">No top tier models available</div>
                    )}

                    {/* More Models Submenu */}
                    {otherModels.length > 0 && (
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="flex items-center justify-between px-3 py-2 mx-1 rounded-md text-sm cursor-pointer hover:bg-white/5 focus:bg-white/5 data-[state=open]:bg-white/5 outline-none">
                                <span className="text-neutral-300">More models</span>
                                {/* Chevron handled by SubTrigger automatically usually, but we can add count */}
                                <span className="ml-auto text-[10px] text-neutral-500 mr-2">{otherModels.length}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent 
                                className="w-[260px] bg-[#1a1a1a] border-neutral-800 text-neutral-200 p-0 shadow-xl overflow-hidden ml-1"
                                sideOffset={8}
                            >
                                <div className="max-h-[300px] overflow-y-auto p-1 scrollbar-hide space-y-0.5">
                                    {otherModels.map(model => (
                                        <ModelItem 
                                            key={model.id} 
                                            model={model} 
                                            isSelected={currentModel === model.id} 
                                            onSelect={() => onModelChange(model.id)} 
                                            getLogo={getLogo}
                                        />
                                    ))}
                                </div>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                    )}
                </>
            ) : (
                /* Search Results (Flat List) */
                <div className="max-h-[300px] overflow-y-auto p-1 scrollbar-hide space-y-0.5">
                    {filteredModels.map(model => (
                        <ModelItem 
                            key={model.id} 
                            model={model} 
                            isSelected={currentModel === model.id} 
                            onSelect={() => onModelChange(model.id)} 
                            getLogo={getLogo}
                        />
                    ))}
                    {filteredModels.length === 0 && (
                        <div className="px-4 py-8 text-center text-xs text-neutral-500">
                            No models found.
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer Area */}
        <div className="border-t border-white/5">
             {onTempChange && (
                 <div className="flex items-center justify-between px-3 py-2.5 transition-colors cursor-pointer group hover:bg-white/5" onClick={() => onTempChange?.(!isTemp)}>
                      <div className="flex items-center gap-2.5">
                           <div className={cn("h-4 w-4 rounded flex items-center justify-center border transition-colors", 
                               isTemp ? "border-amber-500/50 bg-amber-500/10 text-amber-500" : "border-neutral-700 text-neutral-500"
                           )}>
                               <CircleDashed className="h-2.5 w-2.5" />
                           </div>
                           <span className="text-xs font-medium text-neutral-400 group-hover:text-neutral-300">Temporary chat</span>
                      </div>
                      <Switch 
                          checked={isTemp} 
                          onCheckedChange={onTempChange}
                          className="scale-75 data-[state=checked]:bg-amber-600"
                      />
                 </div>
             )}
        </div>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper Component for Model Items to reduce duplication
function ModelItem({ model, isSelected, onSelect, getLogo }: { model: Model, isSelected: boolean, onSelect: () => void, getLogo: any }) {
    const providerConfig = providers[model.provider];
    const logo = providerConfig ? getLogo(model.provider, providerConfig.logo) : "";
    
    return (
        <DropdownMenuItem
          onClick={onSelect}
          className={cn(
            "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer outline-none transition-colors mx-1",
            isSelected ? "bg-blue-500/10" : "hover:bg-white/5 focus:bg-white/5"
          )}
        >
            <div className="flex items-center gap-3 min-w-0">
                 {/* Icon */}
                 <div className="h-6 w-6 rounded-full bg-white p-1 flex items-center justify-center shrink-0 opacity-90">
                     <img src={logo} alt="" className="h-full w-full object-contain" />
                 </div>
                 
                 {/* Name */}
                 <div className="flex items-center gap-2 min-w-0">
                     <span className={cn("text-sm font-medium truncate", isSelected ? "text-blue-400" : "text-neutral-300")}>
                         {model.name}
                     </span>
                     {/* Beta Badge */}
                     {(model.id.includes("beta") || model.id.includes("preview")) && (
                         <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight shrink-0">BETA</span>
                     )}
                 </div>
            </div>

            {isSelected && <Check className="h-4 w-4 text-blue-500 shrink-0" />}
        </DropdownMenuItem>
    );
}
