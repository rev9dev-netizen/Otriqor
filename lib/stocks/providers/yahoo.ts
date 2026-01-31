/* eslint-disable @typescript-eslint/no-explicit-any */
// Fallback implementation without yahoo-finance2 package
export async function getYahooQuote(symbol: string, range: string = "1d", interval: string = "1d") {
  try {
      // Auto-adjust interval based on range
      if (interval === "1d") {
          switch (range.toLowerCase()) {
              case "1d": interval = "2m"; break;
              case "5d": interval = "15m"; break;
              case "1mo": interval = "60m"; break;
              case "6mo": interval = "1d"; break;
              case "ytd": interval = "1d"; break;
              case "1y": interval = "1d"; break; 
              case "5y": interval = "1wk"; break;
              case "max": interval = "1mo"; break;
          }
      }

      const res = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}&includePrePost=true`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "application/json",
            "Origin": "https://finance.yahoo.com"
        }
      });
      const json = await res.json();
      
      const result = json.chart?.result?.[0];
      if (!result) throw new Error("No data found");

      const meta = result.meta;
      const timestamps = result.timestamp || [];
      const quotes = result.indicators?.quote?.[0] || {};
      const closes = quotes.close || [];

      // Filter out nulls (sometimes Yahoo returns nulls for market breaks)
      const chartData = timestamps.map((t: number, i: number) => ({
          time: t * 1000,
          value: closes[i] || null
      })).filter((p: any) => p.value !== null);

      const quote = {
          symbol: meta.symbol,
          longName: meta.longName || meta.shortName, // Fallback
          regularMarketPrice: meta.regularMarketPrice,
          regularMarketChange: meta.regularMarketPrice - meta.chartPreviousClose, // Calc change
          regularMarketChangePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
          regularMarketOpen: meta.regularMarketPrice, // Chart meta often has current price
          regularMarketDayHigh: meta.regularMarketDayHigh,
          regularMarketDayLow: meta.regularMarketDayLow,
          regularMarketVolume: meta.regularMarketVolume,
          marketCap: 0, // Not always in chart meta, might need separate quote endpoint
          currency: meta.currency,
          fullExchangeName: meta.exchangeName
      };

      return {
        symbol: quote.symbol,
        name: quote.longName,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        open: quote.regularMarketOpen,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        currency: quote.currency,
        exchange: quote.fullExchangeName,
        chart: chartData // Return chart data
    };
  } catch (e) {
      console.error("Yahoo Provider Error:", e);
      throw e;
  }
}
