/* eslint-disable @next/next/no-img-element */
import { SearchResult } from "@/lib/tools/web-search";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Newspaper } from "lucide-react";

interface CitationSheetProps {
  citations: SearchResult[];
  children: React.ReactNode;
}

export function CitationSheet({ citations, children }: CitationSheetProps) {
  if (!citations || citations.length === 0) return <>{children}</>;

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col gap-0 border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111]">
        <SheetHeader className="px-6 py-6 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 mb-2">
            <Newspaper className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Citations</span>
          </div>
          <SheetTitle className="text-2xl font-semibold tracking-tight">Sources</SheetTitle>
          <SheetDescription className="text-neutral-500">
            References used to generate the response.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="flex flex-col gap-6">
                {citations.map((citation, index) => (
                    <a 
                        key={index} 
                        href={citation.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block space-y-3 rounded-xl border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 p-4 transition-all"
                    >
                        <div className="flex gap-4">
                            {citation.imageUrl && (
                                <div className="shrink-0">
                                    <img 
                                        src={citation.imageUrl} 
                                        alt="" 
                                        className="h-16 w-24 object-cover rounded-md bg-neutral-100 dark:bg-neutral-800"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    {citation.source && (
                                        <div className="flex items-center gap-1.5">
                                            <img 
                                                src={`https://www.google.com/s2/favicons?domain=${new URL(citation.link).hostname}`}
                                                className="w-3.5 h-3.5 rounded-sm opacity-70"
                                                alt=""
                                            />
                                            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate max-w-[150px]">
                                                {citation.source}
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-neutral-300 dark:text-neutral-700 mx-1">•</span>
                                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                        {citation.date || "Recent"} 
                                    </span>
                                </div>
                                <h3 className="text-sm font-semibold leading-snug text-neutral-900 dark:text-neutral-100 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors line-clamp-2">
                                    {citation.title}
                                </h3>
                            </div>
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-3">
                            {citation.snippet}
                        </p>
                    </a>
                ))}
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
