/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolveSymbol } from "./symbolResolver";
import { getYahooQuote } from "./providers/yahoo";

export async function getStockData(query: string, range: string = "1d", interval: string = "1d") {
  const resolved = await resolveSymbol(query);

  try {
    const yahoo = await getYahooQuote(resolved.symbol, range, interval);
    return normalize(yahoo, resolved);
  } catch (e) {
    console.error("Stock Tool Error:", e);
    // Fallback could go here if implemented
    throw e;
  }
}

function normalize(data: any, resolved: any) {
  return {
    symbol: resolved.symbol,
    name: resolved.name,
    exchange: resolved.exchange,
    price: data.price,
    changePercent: data.changePercent, 
    change: data.change, // Added change value
    open: data.open,
    high: data.high,
    low: data.low,
    volume: data.volume,
    marketCap: data.marketCap ? formatMarketCap(data.marketCap) : "-",
    currency: data.currency,
    marketStatus: "Open", // Simplified
    peRatio: 0, // Placeholder
    dividendYield: "0%", // Placeholder
    updatedAt: Date.now(),
    chart: data.chart // Pass through chart data
  };
}

function formatMarketCap(num: number) {
    if (num > 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num > 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num > 1e6) return (num / 1e6).toFixed(2) + "M";
    return num.toString();
}
