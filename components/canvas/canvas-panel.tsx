"use client";

import * as React from "react";
import { observer } from "mobx-react-lite";
import { canvasStore } from "@/lib/store/canvas-store";
import { X, Copy, Check, FileCode, Maximize2, Minimize2, Play, Code2, TerminalSquare, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeEditor } from "./code-editor";
import { PYODIDE_RUNNER_HTML } from "@/lib/pyodide-runner";

export const CanvasPanel = observer(() => {
    const [isCopied, setIsCopied] = React.useState(false);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [consoleOutput, setConsoleOutput] = React.useState<string[]>([]);
    const [isThinking, setIsThinking] = React.useState(false);
    const [consoleHeight, setConsoleHeight] = React.useState(200); // Initial height
    const [showConsole, setShowConsole] = React.useState(false);
    const [runnerKey, setRunnerKey] = React.useState(0); // To force re-mount
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    const handleCopy = () => {
        navigator.clipboard.writeText(canvasStore.content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const isHtml = canvasStore.language === 'html' || canvasStore.language === 'markup';
    const isPython = canvasStore.language === 'python';

    // Handle Python Execution
    React.useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'PYTHON_OUTPUT') {
                setConsoleOutput(prev => [...prev, event.data.text]);
            } else if (event.data.type === 'PYTHON_ERROR') {
                setConsoleOutput(prev => [...prev, `Error: ${event.data.text}`]);
                setIsThinking(false);
            } else if (event.data.type === 'PYTHON_DONE') {
                setIsThinking(false);
            } else if (event.data.type === 'PYTHON_READY') {
                console.log("Python Ready");
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const runPython = () => {
        if (!iframeRef.current) return;
        setConsoleOutput([]); // Clear previous
        setShowConsole(true);
        setIsThinking(true);
        // Post message to iframe
        iframeRef.current.contentWindow?.postMessage({ type: 'RUN_PYTHON', code: canvasStore.content }, '*');
    };

    const stopPython = () => {
        setIsThinking(false);
        setRunnerKey(prev => prev + 1); // Force remount of iframe
        setConsoleOutput(prev => [...prev, "Program stopped by user."]);
    };

    // Resizing logic
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = consoleHeight;

        const handleMouseMove = (e: MouseEvent) => {
            const newHeight = startHeight - (e.clientY - startY);
            if (newHeight > 50 && newHeight < 600) setConsoleHeight(newHeight);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className={cn(
            "flex flex-col h-full border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] transition-all duration-300 ease-in-out shadow-xl",
            isFullscreen ? "fixed inset-0 z-50 w-full" : "w-[45%] min-w-[400px]"
        )}>
            <Tabs defaultValue={isHtml ? "preview" : "code"} className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <FileCode className="h-4 w-4" />
                            </div>
                            <span>Canvas</span>
                        </div>
                        
                        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-2" />
                        
                        <TabsList className="h-8 bg-neutral-200/50 dark:bg-neutral-800/50 p-0.5">
                            <TabsTrigger value="code" className="h-7 text-xs px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700">
                                <Code2 className="h-3.5 w-3.5 mr-1.5" />
                                Code
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="h-7 text-xs px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700">
                                <Play className="h-3.5 w-3.5 mr-1.5" />
                                Preview
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    
                    <div className="flex items-center gap-1">
                         {isPython && (
                            <Button 
                                variant={isThinking ? "destructive" : "default"}
                                size="sm" 
                                className={cn(
                                    "h-7 text-xs mr-2 transition-colors",
                                    isThinking ? "bg-red-500 hover:bg-red-600" : "bg-purple-600 hover:bg-purple-700 text-white"
                                )}
                                onClick={isThinking ? stopPython : runPython}
                            >
                                {isThinking ? <X className="h-3.5 w-3.5 mr-1.5" /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
                                {isThinking ? "Stop" : "Run"}
                            </Button>
                         )}

                         <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                            {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                         </Button>
                         <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsFullscreen(!isFullscreen)}>
                            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                         </Button>
                         <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />
                         <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500/10 hover:text-red-500" onClick={() => canvasStore.setIsOpen(false)}>
                            <X className="h-3.5 w-3.5" />
                         </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative group bg-[#1e1e1e] flex flex-col">
                    <TabsContent value="code" className="flex-1 m-0 p-0 data-[state=inactive]:hidden overflow-hidden relative">
                         <CodeEditor 
                            value={canvasStore.content} 
                            language={canvasStore.language} 
                            onChange={(val) => canvasStore.setContent(val)} 
                         />
                         
                         {/* Console Panel (Only visible for Python in Code mode or if manually toggled) */}
                         {(showConsole && isPython) && (
                             <div 
                                className="absolute bottom-0 left-0 right-0 bg-[#0e0e0e] border-t border-white/10 flex flex-col z-20 shadow-2xl"
                                style={{ height: consoleHeight }}
                             >
                                 {/* Resizer Handle */}
                                 <div 
                                    className="h-1.5 bg-neutral-800 hover:bg-purple-500/50 cursor-ns-resize flex items-center justify-center group/handle transition-colors"
                                    onMouseDown={handleMouseDown}
                                 >
                                     <div className="w-10 h-0.5 bg-neutral-600 group-hover/handle:bg-white rounded-full" />
                                 </div>
                                 
                                 <div className="flex items-center justify-between px-3 py-1.5 bg-[#141414] border-b border-white/5">
                                     <span className="text-xs text-neutral-400 font-medium flex items-center gap-2">
                                         <TerminalSquare className="h-3.5 w-3.5" />
                                         Console
                                     </span>
                                     <div className="flex gap-2">
                                         <Button variant="ghost" size="icon" className="h-5 w-5 rounded-sm hover:bg-white/10" onClick={() => setConsoleOutput([])}>
                                            <RotateCcw className="h-3 w-3 text-neutral-500" />
                                         </Button>
                                         <Button variant="ghost" size="icon" className="h-5 w-5 rounded-sm hover:bg-white/10" onClick={() => setShowConsole(false)}>
                                            <X className="h-3 w-3 text-neutral-500" />
                                         </Button>
                                     </div>
                                 </div>
                                 <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-neutral-300">
                                     {consoleOutput.map((line, i) => (
                                         <div key={i} className="mb-0.5">{line}</div>
                                     ))}
                                     {consoleOutput.length === 0 && <div className="text-neutral-600 italic">Ready to run...</div>}
                                 </div>
                             </div>
                         )}
                    </TabsContent>
                    
                    <TabsContent value="preview" className="flex-1 m-0 p-0 bg-white data-[state=inactive]:hidden relative">
                        {isPython ? (
                            // For Python, we use the preview tab effectively as a fullscreen console or graphic output if needed
                            // But for now, we just run the specialized runner
                            <iframe 
                                key={runnerKey}
                                ref={iframeRef}
                                srcDoc={PYODIDE_RUNNER_HTML}
                                className="w-full h-full border-none bg-[#0e0e0e]"
                                title="Python Runner"
                                sandbox="allow-scripts allow-same-origin"
                            />
                        ) : (
                            <iframe 
                                srcDoc={canvasStore.content}
                                className="w-full h-full border-none"
                                title="Preview"
                                sandbox="allow-scripts"
                            />
                        )}
                    </TabsContent>
                    
                    {/* Hidden Runner for Python (When in Code View) */}
                    {isPython && (
                         <iframe 
                            key={`hidden-${runnerKey}`}
                            ref={iframeRef}
                            srcDoc={PYODIDE_RUNNER_HTML}
                            className="hidden"
                            title="Python Runner Background"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    )}
                </div>
            </Tabs>
            
            {/* Footer / Status Bar */}
            <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/30 text-[10px] text-neutral-400 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <span className="uppercase">{canvasStore.language}</span>
                    <span>•</span>
                    <span>{canvasStore.content.length} chars</span>
                </div>
                <span>Editable Mode</span>
            </div>
        </div>
    );
});
