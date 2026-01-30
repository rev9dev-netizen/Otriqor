import * as React from "react";
import { cn } from "@/lib/utils";

interface TokenStatsProps {
  stats?: {
    tokensPerSec: number;
    totalTokens: number;
    timeToFirstToken: number;
  };
  className?: string;
}

export function TokenStats({ stats, className }: TokenStatsProps) {
  // If we're streaming, we might want to show partial stats or a "Generating..." state
  // For now, if no stats, don't render.
  if (!stats) return null;

  return (
    <div className={cn(
        "flex items-center gap-2 text-[10px] text-neutral-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none",
        className
    )}>
      <span>{stats.tokensPerSec.toFixed(2)} tok/sec</span>
      <span>|</span>
      <span>{stats.totalTokens} tokens</span>
      <span>|</span>
      <span>{stats.timeToFirstToken.toFixed(2)}s to first token</span>
    </div>
  );
}
