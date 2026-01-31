// Fallback implementation without yahoo-finance2 package
export async function resolveSymbol(query: string) {
  try {
    // Reverted to query2 search as v7/quote returns 401
    const res = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "application/json",
            "Origin": "https://finance.yahoo.com"
        }
    });
  
    if (!res.ok) {
      throw new Error(`Yahoo error ${res.status}`);
    }
  
    const data = await res.json();
    if (!data.quotes || data.quotes.length === 0) {
        throw new Error("Symbol not found");
    }

    const best = data.quotes[0];

    return {
      symbol: best.symbol,
      name: best.shortname || best.longname,
      exchange: best.exchange,
      type: best.quoteType
    };
  } catch (e) {
      console.error("Symbol Resolve Error:", e);
      throw e;
  }
}
