export const tools = [
    {
        type: "function" as const,
        function: {
            name: "web_search",
            description: "Search the web for current information, news, or specific facts.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query to execute"
                    }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "get_stock",
            description: "Get real-time stock quote for any global stock, crypto, or ETF.",
            parameters: {
                type: "object",
                properties: {
                     query: { type: "string", description: "Symbol or name (e.g. 'Apple', 'BTC', 'Reliance')" }
                },
                required: ["query"]
            }
        }
    }
  ];
