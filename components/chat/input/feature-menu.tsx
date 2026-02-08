import * as React from "react";
import { 
    Plus, Globe, Layout, Bot, Paperclip 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface FeatureMenuProps {
    onActivateFeature: (id: string, label: string, icon: React.ReactNode) => void;
}

export function FeatureMenu({ onActivateFeature }: FeatureMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-800 dark:text-neutral-200 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                    <Plus className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-[#1e1e1e] border-white/10 text-neutral-300">
                {/* Section 1: Core Inputs */}
                <DropdownMenuItem onClick={() => onActivateFeature("upload", "Add photos & files", <Paperclip className="h-4 w-4" />)} className="gap-2 text-xs py-2.5 cursor-pointer focus:bg-white/10 focus:text-white">
                    <Paperclip className="h-4 w-4" /> Add photos & files
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-white/10" />

                {/* Section 2: Research & Tools */}
                <DropdownMenuItem onClick={() => onActivateFeature("web-search", "Web search", <Globe className="h-4 w-4" />)} className="gap-2 text-xs py-2.5 cursor-pointer focus:bg-white/10 focus:text-white">
                    <Globe className="h-4 w-4" /> Web search
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onActivateFeature("deep-research", "Deep research", <Globe className="h-4 w-4" />)} className="gap-2 text-xs py-2.5 cursor-pointer focus:bg-white/10 focus:text-white">
                    <Bot className="h-4 w-4" /> Deep research
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => onActivateFeature("canvas", "Canvas", <Layout className="h-4 w-4" />)} className="gap-2 text-xs py-2.5 cursor-pointer focus:bg-white/10 focus:text-white">
                    <Layout className="h-4 w-4" /> Canvas
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-white/10" />

                {/* Section 3: Advanced Modes */}
                <DropdownMenuItem onClick={() => onActivateFeature("agent", "Agent mode", <Bot className="h-4 w-4" />)} className="gap-2 text-xs py-2.5 cursor-pointer focus:bg-white/10 focus:text-white">
                    <Bot className="h-4 w-4" /> Agent mode
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
