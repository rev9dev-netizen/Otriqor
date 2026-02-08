/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, Settings } from "lucide-react";

interface MCPEnablePromptProps {
    integration: {
        id: string;
        name: string;
        icon: string;
    };
    action: string;
    onEnable: () => void;
    onOpenSkillStore: () => void;
}

/**
 * In-chat prompt shown when user requests an action that requires
 * an MCP that is connected but not enabled for this session.
 */
export function MCPEnablePrompt({ 
    integration, 
    action, 
    onEnable, 
    onOpenSkillStore 
}: MCPEnablePromptProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 max-w-md shadow-xl"
        >
            {/* Header with integration icon */}
            <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-neutral-800 overflow-hidden flex items-center justify-center">
                    {integration.icon ? (
                        <img 
                            src={integration.icon} 
                            alt={integration.name} 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <Zap className="h-6 w-6 text-neutral-400" />
                    )}
                </div>
                <div>
                    <h3 className="font-semibold text-neutral-100">
                        {integration.name} Access
                    </h3>
                    <p className="text-xs text-neutral-500">
                        Connected but needs activation
                    </p>
                </div>
            </div>
            
            {/* Description */}
            <p className="text-sm text-neutral-400 mb-5 leading-relaxed">
                <span className="text-neutral-200 font-medium">{integration.name}</span> is connected 
                but not enabled for this conversation. To {action}, you need to enable it.
            </p>
            
            {/* Actions */}
            <div className="flex gap-3">
                <Button 
                    onClick={onEnable}
                    className="flex-1 bg-white text-black hover:bg-neutral-200 font-medium"
                >
                    <Zap className="h-4 w-4 mr-2" />
                    Enable {integration.name}
                </Button>
                <Button 
                    variant="ghost" 
                    onClick={onOpenSkillStore}
                    className="text-neutral-400 hover:text-neutral-200"
                >
                    <Settings className="h-4 w-4" />
                </Button>
            </div>
            
            {/* Info text */}
            <p className="text-[11px] text-neutral-500 mt-4 text-center">
                You can manage integrations anytime from the Connector Store
            </p>
        </motion.div>
    );
}
