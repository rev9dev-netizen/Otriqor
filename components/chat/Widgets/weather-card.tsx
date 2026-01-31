/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { Cloud, CloudRain, Sun, Wind, Droplets, Snowflake, CloudLightning, CloudFog, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherData {
    city: string;
    current: {
        temp: number;
        condition: string;
        humidity: number;
        windSpeed: number;
        isDay: boolean;
    };
    daily?: Array<{
        date: string;
        dayName: string;
        high: number;
        low: number;
        condition: string;
    }>;
    hourly?: Array<{
        time: string;
        temp: number;
        condition: string;
    }>;
    forecast?: {
        daily: Array<{
            date: string;
            dayName: string;
            high: number;
            low: number;
            condition: string;
        }>;
        hourly: Array<{
            time: string;
            temp: number;
            condition: string;
        }>;
    };
}

const getWeatherIcon = (condition: string, className?: string) => {
    const c = condition.toLowerCase();
    if (c.includes("rain") || c.includes("drizzle")) return <CloudRain className={className} />;
    if (c.includes("snow")) return <Snowflake className={className} />;
    if (c.includes("thunder")) return <CloudLightning className={className} />;
    if (c.includes("cloud") || c.includes("overcast")) return <Cloud className={className} />;
    if (c.includes("fog")) return <CloudFog className={className} />;
    return <Sun className={className} />;
};

export function WeatherCard({ data }: { data: any }) {
    // Normalize data: support both flat structure and nested 'forecast' structure
    // And handle 'temperature' vs 'temp' mismatch
    const rawCurrent = data?.current;
    const rawDaily = data?.daily || data?.forecast?.daily;
    const rawHourly = data?.hourly || data?.forecast?.hourly;
    const city = data?.city;

    if (!rawCurrent || !rawDaily || !rawHourly) return null;

    const current = {
        ...rawCurrent,
        temp: rawCurrent.temp ?? rawCurrent.temperature
    };

    const hourly = rawHourly.map((h: any) => ({
        ...h,
        temp: h.temp ?? h.temperature
    }));

    const daily = rawDaily;

    return (
        <div className="relative w-full mx-auto overflow-hidden rounded-3xl bg-[#0a0a0a] text-white border border-white/10 shadow-2xl font-sans">
             {/* Background Gradient Spot */}
             <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
             <div className="absolute top-1/2 -left-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

             <div className="relative p-6 z-10">
                {/* Header: Location & Date */}
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-2 text-neutral-400 text-sm font-medium">
                        <MapPin className="w-4 h-4" />
                        <span>{city}</span>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-medium text-neutral-300">{daily[0]?.dayName ?? ''}, {daily[0]?.date ?? ''}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Main Current Weather */}
                    <div className="flex flex-col justify-between">
                         <div>
                             <div className="flex items-start">
                                <h1 className="text-8xl font-light tracking-tighter text-white">
                                    {Math.round(current.temp)}°
                                </h1>
                             </div>
                             <div className="mt-2 text-2xl font-normal text-neutral-300 tracking-wide">
                                 {current.condition}
                             </div>
                         </div>
                         
                         <div className="flex gap-6 mt-8">
                             <div className="flex flex-col gap-1">
                                 <div className="flex items-center gap-2 text-neutral-500 text-xs uppercase tracking-wider font-semibold">
                                     <Wind className="w-3 h-3" /> Wind
                                 </div>
                                 <span className="text-lg font-medium">{current.windSpeed} km/h</span>
                             </div>
                             <div className="flex flex-col gap-1">
                                 <div className="flex items-center gap-2 text-neutral-500 text-xs uppercase tracking-wider font-semibold">
                                     <Droplets className="w-3 h-3" /> Rain
                                 </div>
                                 <span className="text-lg font-medium">{current.humidity}%</span>
                             </div>
                         </div>
                    </div>

                    {/* Right: Weekly List */}
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
                        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 pl-1">7-Day Forecast</h3>
                        <div className="space-y-3">
                            {daily.slice(0, 5).map((d: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-sm group">
                                    <span className={cn("w-16 font-medium", i === 0 ? "text-white" : "text-neutral-400")}>
                                        {i === 0 ? "Today" : (d.dayName ? d.dayName.substring(0, 3) : new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }))}
                                    </span>
                                    <div className="flex-1 flex justify-center">
                                         {getWeatherIcon(d.condition, "w-4 h-4 text-neutral-300")}
                                    </div>
                                    <div className="flex gap-3 text-right w-20 justify-end font-mono text-xs">
                                        <span className="text-white font-medium">{d.high}°</span>
                                        <span className="text-neutral-500">{d.low}°</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom: Hourly */}
                <div className="mt-8 pt-6 border-t border-white/5">
                     <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Hourly Forecast</h3>
                     <div className="flex justify-between items-center overflow-x-auto pb-2 scrollbar-hide gap-4">
                         {hourly.map((h: any, i: number) => (
                             <div key={i} className="flex flex-col items-center gap-2 min-w-[3rem]">
                                 <span className="text-xs text-neutral-500 font-medium">{h.time}</span>
                                 {getWeatherIcon(h.condition, "w-5 h-5 text-neutral-300")}
                                 <span className="text-sm font-semibold text-white">{h.temp}°</span>
                             </div>
                         ))}
                     </div>
                </div>
             </div>
        </div>
    );
}

export function WeatherSkeleton() {
    return (
        <div className="w-full max-w-2xl mx-auto h-[400px] rounded-3xl bg-[#0a0a0a] border border-white/10 animate-pulse" />
    );
}
