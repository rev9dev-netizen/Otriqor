import { Tool } from "../types";
import { getStockData } from "@/lib/stocks/stockTool";

export const stockTool: Tool = {
    definition: {
        name: "get_stock",
        description: "Get real-time stock quote for any global stock, crypto, or ETF.",
        parameters: {
            type: "object",
            properties: {
                 query: { type: "string", description: "Symbol or name (e.g. 'Apple', 'BTC', 'Reliance')" }
            },
            required: ["query"]
        }
    },
    execute: async (args) => {
        const data = await getStockData(args.query);
        return {
            content: JSON.stringify(data)
        };
    }
};
