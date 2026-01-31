/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { models, providers, Model } from "@/lib/config/models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown, Eye, Brain, Globe, Box, CheckCircle2 } from "lucide-react";

interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (modelId: string) => void;
}

// ... imports

export function ModelSelector({ currentModel, onModelChange }: ModelSelectorProps) {
  const [availableModels, setAvailableModels] = React.useState<Model[]>(models);
  const [disabledModelIds, setDisabledModelIds] = React.useState<Set<string>>(new Set());
  const [enabledProviderIds, setEnabledProviderIds] = React.useState<Set<string>>(new Set(["mistral"])); // Default
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Load disabled models preferences
    const savedDisabled = localStorage.getItem("disabled_models");
    if (savedDisabled) {
        try {
            setDisabledModelIds(new Set(JSON.parse(savedDisabled)));
        } catch(e) { console.error("Error loading disabled logic", e); }
    }

    // Load enabled providers preferences
    const savedProviders = localStorage.getItem("enabled_providers");
    if (savedProviders) {
        try {
            setEnabledProviderIds(new Set(JSON.parse(savedProviders)));
        } catch(e) { console.error("Error loading provider logic", e); }
    }

    async function fetchData() {
      try {
        // 1. Fetch Models
        const modelsRes = await fetch("/api/models");
        let allModels: Model[] = [];
        if (modelsRes.ok) {
          const data = await modelsRes.json();
          const uniqueModels = new Map();
          data.models.forEach((m: Model) => {
              if (!uniqueModels.has(m.id)) {
                  uniqueModels.set(m.id, m);
              }
          });
          allModels = Array.from(uniqueModels.values());
          setAvailableModels(allModels);
        }

        // 2. Fetch Availability (Keys present?)
        const availRes = await fetch("/api/models/availability");
        if (availRes.ok) {
            const { providers } = await availRes.json();
            const activeProviders = new Set<string>();
            Object.entries(providers).forEach(([provider, isAvailable]) => {
                if (isAvailable) activeProviders.add(provider);
            });
            setEnabledProviderIds(activeProviders);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter out disabled models AND disabled providers
  const enabledModels = React.useMemo(() => {
     return availableModels.filter(m => 
        !disabledModelIds.has(m.id) && 
        enabledProviderIds.has(m.provider)
     );
  }, [availableModels, disabledModelIds, enabledProviderIds]);

  const activeModel = enabledModels.find((m) => m.id === currentModel) || enabledModels[0] || models[0];
  const activeProvider = providers[activeModel.provider]; // If activeModel fallback is used, ensure safe access

  // Group models by provider
  const modelsByProvider = React.useMemo(() => {
    const grouped: Record<string, Model[]> = {};
    enabledModels.forEach((model) => {
      if (!grouped[model.provider]) {
        grouped[model.provider] = [];
      }
      grouped[model.provider].push(model);
    });
    return grouped;
  }, [enabledModels]);

  if (!activeProvider) return null; // Fallback

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium text-white group outline-none">
          <div className="h-5 w-5 rounded-full flex items-center justify-center bg-white p-0.5 overflow-hidden">
             <img 
               src={activeProvider.logo} 
               alt={activeModel.name} 
               className="h-full w-full object-contain"
             />
          </div>
          {/* ... */}
          <span className="text-neutral-200 group-hover:text-white transition-colors">
            {activeModel.name}
          </span>
          <ChevronDown className="h-3 w-3 text-neutral-500 group-hover:text-white transition-colors" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-[500px] bg-[#1a1a1a]/95 backdrop-blur-xl border-white/10 p-0 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
           <span>Model Name</span>
           <span>Capabilities</span>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-hide">
          {Object.entries(modelsByProvider).map(([providerId, providerModels]) => {
            const providerConfig = providers[providerId as keyof typeof providers];
            if (!providerConfig) return null;

            return (
              <div key={providerId} className="mb-2 last:mb-0">
                {/* Provider Header */}
                <div className="px-2 py-1.5 text-xs font-semibold text-neutral-400 flex items-center gap-2">
                   <img src={providerConfig.logo} alt={providerConfig.name} className="h-3 w-3 opacity-50" />
                   {providerConfig.name}
                </div>

                {/* Models List */}
                <div className="space-y-1">
                  {providerModels.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => onModelChange(model.id)}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all outline-none group gap-4",
                        currentModel === model.id 
                          ? "bg-white/10" 
                          : "hover:bg-white/5"
                      )}
                    >
                      {/* Left: Icon + Name */}
                      <div className="flex items-center gap-3 min-w-0">
                         <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-white p-1 overflow-hidden">
                             <img 
                               src={providers[model.provider].logo} 
                               alt={model.name} 
                               className="h-full w-full object-contain"
                             />
                         </div>
                         <div className="flex flex-col min-w-0">
                             <span className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors truncate">
                                 {model.name}
                             </span>
                             {currentModel === model.id && (
                               <div className="flex items-center gap-1 text-[10px] text-green-400">
                                 <CheckCircle2 className="h-3 w-3" />
                                 <span>Active</span>
                               </div>
                             )}
                         </div>
                      </div>
          
                      {/* Right: Capabilities + Tokens */}
                      <div className="flex items-center gap-3 shrink-0">
                          {/* Capability Icons */}
                          <div className="flex items-center gap-1.5">
                              {/* Reasoning / Thinking */}
                              {model.capabilities.thinking && (
                                  <div className="p-1.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20" title="Reasoning">
                                      <Brain className="h-3.5 w-3.5" />
                                  </div>
                              )}
                              {/* Code (Implicit or explicit? Using functionCall/general for now, or just Brain variants) */}
                              {/* Vision */}
                              {model.capabilities.vision && (
                                  <div className="p-1.5 rounded bg-green-500/10 text-green-400 border border-green-500/20" title="Vision">
                                      <Eye className="h-3.5 w-3.5" />
                                  </div>
                              )}
                              {/* Web Search */}
                              {model.capabilities.webSearch && (
                                   <div className="p-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20" title="Web Search">
                                      <Globe className="h-3.5 w-3.5" />
                                   </div>
                              )}
                              {/* Function Calling / Tools */}
                              {model.capabilities.functionCall && (
                                   <div className="p-1.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20" title="Tools">
                                      <Box className="h-3.5 w-3.5" />
                                   </div>
                              )}
                          </div>
          
                          {/* Vertical Divider */}
                          <div className="h-4 w-px bg-white/10" />
          
                          {/* Token Count Badge */}
                          <div className="px-2 py-0.5 rounded bg-white/5 text-neutral-500 text-[10px] font-mono font-medium min-w-[50px] text-center border border-white/5">
                              {model.maxTokens >= 1000 ? `${Math.round(model.maxTokens / 1000)}K` : model.maxTokens}
                          </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
