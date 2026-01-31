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
    },
    {
        type: "function" as const,
        function: {
            name: "get_current_time",
            description: "Get the current date and time. Useful for verifying 'today', 'now', or checking timezones (e.g. 'time in India').",
            parameters: {
                type: "object",
                properties: {
                     timezone: { type: "string", description: "Optional timezone abbreviation (IST, EST, etc) or IANA ID." }
                }
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "get_weather",
            description: "Get real-time weather and forecast for a specific city.",
            parameters: {
                type: "object",
                properties: {
                    city: { type: "string", description: "The city name (e.g. 'San Francisco', 'London')" }
                },
                required: ["city"]
            }
        }
    }
  ];
