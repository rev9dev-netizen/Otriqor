import React, { useState } from 'react';
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStockData } from "@/lib/stocks/stockTool";

export interface StockData {
    symbol: string;
    name: string;
    price: number;
    currency: string;
    change: number;
    changePercent: number;
    marketStatus?: "Open" | "Closed";
    afterHoursPrice?: number;
    afterHoursChange?: number;
    exchange: string;
    // Basic stats
    range?: string; // "Day Range"
    open?: number;
    high?: number;
    low?: number;
    marketCap?: string;
    peRatio?: number;
    dividendYield?: string;
    chart?: { time: number; value: number }[];
}

const RANGES = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "Max"];

export function StockCard({ data: initialData }: { data: StockData }) {
    const [data, setData] = useState<StockData>(initialData);
    const [selectedRange, setSelectedRange] = useState("1D");
    const [isLoading, setIsLoading] = useState(false);
    const [hoverPrice, setHoverPrice] = useState<number | null>(null);
    const [hoverTime, setHoverTime] = useState<string | null>(null);
    const [mouseX, setMouseX] = useState<number | null>(null);
    
    // Simple in-memory cache for this component instance
    const [cache, setCache] = useState<Record<string, StockData>>({ "1D": initialData });

    const isPositive = data.change >= 0;

    // Auto-switch to 5D if 1D is empty (e.g. weekends/market closed)
    React.useEffect(() => {
        if (selectedRange === "1D" && data.chart && data.chart.length === 0) {
            handleRangeChange("5D");
        }
    }, [data.chart, selectedRange]);

    const handleRangeChange = async (range: string) => {
        if (range === selectedRange) return;
        setSelectedRange(range);
        
        // Check cache first
        if (cache[range]) {
            setData(cache[range]);
            return;
        }

        setIsLoading(true);
        try {
             const apiRange = range.toLowerCase();
             const freshData = await getStockData(data.symbol, apiRange);
             setData(freshData);
             setCache(prev => ({ ...prev, [range]: freshData })); // Update cache
        } catch (e) {
            console.error("Failed to update chart", e);
        } finally {
            setIsLoading(false);
        }
    };

    // Chart helpers
    const chartPoints = data.chart || [];
    const hasChart = chartPoints.length > 0;
    
    // Calculate simple path
    const getPath = () => {
        if (!hasChart) return "";
        const min = Math.min(...chartPoints.map(p => p.value));
        const max = Math.max(...chartPoints.map(p => p.value));
        const range = max - min;
        
        // SVG viewbox 0 0 500 100
        // X scale: 0 to 500
        // Y scale: 100 (bottom) to 0 (top)
        
        const pts = chartPoints.map((p, i) => {
            const x = (i / (chartPoints.length - 1)) * 500;
            const normalizedY = (p.value - min) / (range || 1); // Avoid div by 0
            const y = 100 - (normalizedY * 80 + 10); // Padding 10
            return `${x},${y}`;
        });
        
        return "M" + pts.join(" L");
    };

    const getAreaPath = () => {
         const line = getPath();
         if (!line) return "";
         return `${line} V150 H0 Z`;
    };

    const getCurrencySymbol = (currency: string) => {
        switch (currency) {
            case "USD": return "$";
            case "EUR": return "€";
            case "GBP": return "£";
            case "JPY": return "¥";
            case "INR": return "₹";
            default: return currency;
        }
    };

    return (
        <div className="w-full bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden my-4 font-sans text-neutral-900 dark:text-neutral-100">
            {/* Header */}
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex justify-between items-start mb-1">
                     {/* Left: Logo & Name */}
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-xl font-bold text-neutral-500">
                            {data.symbol[0]}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold leading-tight">{data.symbol}</h3>
                            <div className="text-sm text-neutral-500 font-medium mt-0.5">
                                {data.name} <span className="text-neutral-400">• {data.exchange}</span>
                            </div>
                        </div>
                    </div>

                    {/* Badge */}
                     <div className={cn(
                        "px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider w-fit h-fit",
                        isPositive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                        {isPositive ? "Bullish" : "Bearish"}
                    </div>
                </div>

                {/* Main Price Area & Tabs */}
                <div className="mt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                     {/* Price Section */}
                     <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                                {getCurrencySymbol(data.currency)}
                            </span>
                            <span className="text-4xl font-bold tracking-tight">
                                {hoverPrice ? hoverPrice.toFixed(2) : data.price.toFixed(2)}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                            <div className={cn(
                                "flex items-center gap-1 font-semibold text-sm",
                                isPositive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                            )}>
                                {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                {Math.abs(data.change).toFixed(2)} ({Math.abs(data.changePercent).toFixed(2)}%)
                            </div>
                            {hoverTime ? (
                                <span className="text-xs text-neutral-400 font-medium">{hoverTime}</span>
                            ) : (
                                <span className="text-xs text-neutral-400 font-medium">today</span>
                            )}
                        </div>
                     </div>

                     {/* Time Range Tabs (Right aligned, bottom of price area) */}
                    <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                        {RANGES.map(r => (
                            <button
                                key={r}
                                onClick={() => handleRangeChange(r)}
                                className={cn(
                                    "px-2 py-1 text-[10px] font-bold rounded-md transition-colors whitespace-nowrap",
                                    selectedRange === r 
                                        ? "bg-neutral-900 dark:bg-white text-white dark:text-black" 
                                        : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Interactive Graph Area */}
             <div className="h-64 w-full bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800 group overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-20">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
                    </div>
                )}
                
                {hasChart ? (
                     <div className="w-full h-full p-4 pb-2 flex flex-col">
                        {/* Upper Section: Y-Axis + Chart */}
                        <div className="flex-1 flex w-full relative min-h-0">
                            {/* Y-Axis Track (Left) */}
                            <div className="w-8 flex-shrink-0 relative border-r border-neutral-200 dark:border-neutral-800">
                                {(() => {
                                    const min = Math.min(...chartPoints.map(p => p.value));
                                    const max = Math.max(...chartPoints.map(p => p.value));
                                    const range = max - min;
                                    return [0, 0.25, 0.5, 0.75, 1].map((step) => (
                                        <div 
                                            key={step} 
                                            className="absolute right-1 text-[10px] text-neutral-400 font-medium whitespace-nowrap"
                                            style={{ top: `${step * 100}%`, transform: 'translateY(-50%)' }}
                                        >
                                            {(max - range * step).toFixed(0)}
                                        </div>
                                    ));
                                })()}
                            </div>

                            {/* Chart Container (Clipped) */}
                            <div className="flex-1 relative h-full overflow-hidden">
                                <svg 
                                    className="w-full h-full cursor-crosshair" 
                                    preserveAspectRatio="none" 
                                    viewBox="0 0 500 100"
                                    onMouseLeave={() => { setHoverPrice(null); setHoverTime(null); setMouseX(null); }}
                                    onMouseMove={(e) => {
                                         const rect = e.currentTarget.getBoundingClientRect();
                                         const xRaw = e.clientX - rect.left;
                                         const width = rect.width;
                                         // Bound mouseX to 0-500 safely
                                         const ratio = Math.max(0, Math.min(1, xRaw / width));
                                         
                                         setMouseX(ratio * 500);

                                         const index = Math.min(Math.floor(ratio * chartPoints.length), chartPoints.length - 1);
                                         const point = chartPoints[index];
                                         if (point) {
                                             setHoverPrice(point.value);
                                             setHoverTime(new Date(point.time).toLocaleDateString() + ' ' + new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }));
                                         }
                                    }}
                                 >
                                    <defs>
                                        <linearGradient id={`${data.symbol}-gradient`} x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity="0.2" />
                                            <stop offset="100%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {/* Grid Lines */}
                                    {[0, 0.25, 0.5, 0.75, 1].map(step => (
                                        <line key={step} x1="0" y1={step * 100} x2="500" y2={step * 100} stroke="#e5e5e5" strokeOpacity="0.1" vectorEffect="non-scaling-stroke" />
                                    ))}

                                    <path d={getAreaPath()} fill={`url(#${data.symbol}-gradient)`} />
                                    <path d={getPath()} fill="none" stroke={isPositive ? "#22c55e" : "#ef4444"} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                    
                                    {/* Crosshair Line */}
                                    {mouseX !== null && (
                                        <line 
                                            x1={mouseX} y1="0" 
                                            x2={mouseX} y2="100" 
                                            stroke="#a3a3a3" 
                                            strokeWidth="1" 
                                            strokeDasharray="4 4" 
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    )}
                                </svg>
                                
                                {/* Floating Dot (Inside Clipped Area) */}
                                {mouseX !== null && hoverPrice && (
                                    <div 
                                        className="absolute w-3 h-3 bg-white border-2 border-neutral-900 dark:border-white dark:bg-black rounded-full shadow-md pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-20"
                                        style={{
                                            left: `${(mouseX / 500) * 100}%`,
                                            top: (() => {
                                                const min = Math.min(...chartPoints.map(p => p.value));
                                                const max = Math.max(...chartPoints.map(p => p.value));
                                                const range = max - min;
                                                const normalizedY = (hoverPrice - min) / (range || 1);
                                                const yPercent = 100 - (normalizedY * 80 + 10);
                                                return `${yPercent}%`; 
                                            })()
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                        
                        {/* Lower Section: X-Axis Spacer + Labels */}
                        <div className="h-6 flex w-full mt-1">
                             <div className="w-8 mr-2 flex-shrink-0"/> {/* Spacer matching Y-axis width */}
                             <div className="flex-1 relative flex justify-between text-[10px] text-neutral-400 font-medium px-1">
                                 {(() => {
                                     // Simple logic to pick 5 points for X axis
                                     if (chartPoints.length === 0) return null;
                                     const count = 5;
                                     const step = Math.floor((chartPoints.length - 1) / (count - 1));
                                     
                                     return Array.from({ length: count }).map((_, i) => {
                                         const pt = chartPoints[Math.min(i * step, chartPoints.length - 1)];
                                         let label = "";
                                         const date = new Date(pt.time);
                                         
                                         // Format based on range
                                         if (selectedRange === "1D") {
                                             label = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                                         } else if (selectedRange === "5D" || selectedRange === "1M") {
                                             label = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                                         } else if (selectedRange === "6M" || selectedRange === "YTD" || selectedRange === "1Y") {
                                             label = date.toLocaleDateString([], { month: 'short', year: '2-digit' });
                                         } else {
                                             label = date.getFullYear().toString();
                                         }

                                         return <span key={i}>{label}</span>;
                                     });
                                 })()}
                            </div>
                        </div>
                     </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-neutral-400 text-sm">
                        Chart data unavailable
                    </div>
                )}
            </div>

            {/* Loop Stats */}
            <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/50">
                    <span className="text-neutral-500">Open</span>
                    <span className="font-medium">{data.open?.toFixed(2) || "-"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/50">
                    <span className="text-neutral-500">High</span>
                    <span className="font-medium">{data.high?.toFixed(2) || "-"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/50">
                    <span className="text-neutral-500">Low</span>
                    <span className="font-medium">{data.low?.toFixed(2) || "-"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/50">
                    <span className="text-neutral-500">Mkt Cap</span>
                    <span className="font-medium">{data.marketCap || "-"}</span>
                </div>
                 <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/50">
                    <span className="text-neutral-500">P/E Ratio</span>
                    <span className="font-medium">{data.peRatio?.toFixed(2) || "-"}</span>
                </div>
                 <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/50">
                    <span className="text-neutral-500">Div Yield</span>
                    <span className="font-medium">{data.dividendYield || "-"}</span>
                </div>
            </div>
        </div>
    );
}

export function StockSkeleton() {
    return (
        <div className="w-full bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden my-4 font-sans max-w-full">
            {/* Header Skeleton */}
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex justify-between items-start mb-1">
                    <div className="flex gap-4">
                        {/* Logo Skeleton */}
                        <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                        <div>
                            {/* Symbol Skeleton */}
                            <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-1" />
                            {/* Name Skeleton */}
                            <div className="h-4 w-32 bg-neutral-100 dark:bg-neutral-800/50 rounded animate-pulse" />
                        </div>
                    </div>
                    {/* Badge Skeleton */}
                    <div className="w-16 h-6 bg-neutral-100 dark:bg-neutral-800/50 rounded animate-pulse" />
                </div>

                {/* Price Area Skeleton */}
                <div className="mt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="h-10 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-2" />
                        <div className="h-4 w-24 bg-neutral-100 dark:bg-neutral-800/50 rounded animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Chart Area Skeleton */}
            <div className="h-64 w-full bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800 relative">
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-700 border-t-transparent rounded-full animate-spin"/>
                        <span className="text-xs text-neutral-400 font-medium animate-pulse">Loading Chart...</span>
                    </div>
                 </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-8">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/50">
                         <div className="h-4 w-12 bg-neutral-100 dark:bg-neutral-800/50 rounded animate-pulse" />
                         <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    );
}
