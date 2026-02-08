/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Model } from "@/lib/config/models"
import { Brain, Globe, Box, Eye } from "lucide-react"

interface ModelConfigDialogProps {
    model: Model | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (modelId: string, updates: Partial<Model>) => void;
}

export function ModelConfigDialog({ model, open, onOpenChange, onSave }: ModelConfigDialogProps) {
    const [name, setName] = React.useState("");
    const [maxTokens, setMaxTokens] = React.useState(32000);
    const [capabilities, setCapabilities] = React.useState({
        vision: false,
        thinking: false,
        webSearch: false,
        functionCall: false,
        imageGeneration: false,
        videoRecognition: false
    });
    const [type, setType] = React.useState("chat");
    const [cost, setCost] = React.useState({ input: 0, output: 0 });

    React.useEffect(() => {
        if (model) {
            setName(model.name);
            setMaxTokens(model.maxTokens);
            // Safety check for capabilities as they might be partial
            setCapabilities({
                vision: model.capabilities.vision || false,
                thinking: model.capabilities.thinking || false,
                webSearch: model.capabilities.webSearch || false,
                functionCall: model.capabilities.functionCall || false,
                imageGeneration: model.capabilities.imageGeneration || false,
                videoRecognition: model.capabilities.videoRecognition || false
            });
            setType(model.type || 'chat');
            setCost(model.cost || { input: 0, output: 0 });
        }
    }, [model]);

    const handleSave = () => {
        if (!model) return;
        onSave(model.id, {
            name,
            // We only allow renaming and capability overrides now, 
            // but for now we keep sending the other data back in case we revert
            maxTokens,
            type: type as any,
            cost,
            capabilities
        });
        onOpenChange(false);
    };

    if (!model) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-[#0f0f0f] border-white/10 text-white max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Model Details</DialogTitle>
                    <DialogDescription>
                        View details and capabilities for {model.id}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="model-id" className="text-neutral-400">Model ID</Label>
                            <Input id="model-id" value={model.id} disabled className="bg-white/5 border-white/10 text-neutral-500" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="model-name" className="text-white">Display Name</Label>
                            <Input 
                                id="model-name" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="bg-[#1a1a1a] border-white/10 text-white focus:border-purple-500/50" 
                            />
                        </div>
                    </div>

                    <Separator className="bg-white/5" />

                    {/* Context & Cost (Read Only) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white">Context Window</Label>
                            <div className="bg-[#1a1a1a] border border-white/10 px-3 py-2 rounded-md text-sm font-mono text-neutral-300 flex items-center gap-2">
                                <span className="text-neutral-500 max-w-[100px] truncate" title="Sourced from API/Defaults">Limit:</span>
                                {maxTokens.toLocaleString()} tokens
                            </div>
                        </div>

                         <div className="space-y-2">
                            <Label className="text-white">Pricing (per 1M input/output)</Label>
                            <div className="bg-[#1a1a1a] border border-white/10 px-3 py-2 rounded-md text-sm font-mono text-neutral-300 flex items-center gap-2">
                                <span className="text-neutral-500">$</span>
                                {cost.input} / {cost.output}
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-white/5" />

                    {/* Capabilities */}
                    <div className="space-y-4">
                        <Label className="text-white">Capabilities</Label>
                        <div className="flex flex-wrap gap-2">
                             {/* Only show relevant capabilities */}
                             
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                                <Switch 
                                    checked={capabilities.functionCall}
                                    onCheckedChange={(c) => setCapabilities(prev => ({ ...prev, functionCall: c }))}
                                />
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <Box className="h-3.5 w-3.5 text-orange-500" />
                                    Function Calling
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                                <Switch 
                                    checked={capabilities.vision}
                                    onCheckedChange={(c) => setCapabilities(prev => ({ ...prev, vision: c }))}
                                />
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <Eye className="h-3.5 w-3.5 text-green-500" />
                                    Vision
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                                <Switch 
                                    checked={capabilities.thinking}
                                    onCheckedChange={(c) => setCapabilities(prev => ({ ...prev, thinking: c }))}
                                />
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <Brain className="h-3.5 w-3.5 text-purple-500" />
                                    Deep Thinking
                                </div>
                            </div>

                            {/* Hidden WebSearch/Video unless enabled to reduce clutter as requested */}
                            {capabilities.webSearch && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                                    <Switch 
                                        checked={capabilities.webSearch}
                                        onCheckedChange={(c) => setCapabilities(prev => ({ ...prev, webSearch: c }))}
                                    />
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <Globe className="h-3.5 w-3.5 text-blue-500" />
                                        Web Search
                                    </div>
                                </div>
                            )}

                        </div>
                        <p className="text-[10px] text-neutral-500 pt-1">
                            Use these toggles to override detected capabilities passed to the LLM.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-neutral-400 hover:text-white">Cancel</Button>
                    <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
