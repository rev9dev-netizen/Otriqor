import { Tool } from "../types";
import { searchWeb } from "../web-search";

export const webSearchTool: Tool = {
    definition: {
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
    },
    execute: async (args) => {
        const results = await searchWeb(args.query);
        return {
            content: JSON.stringify(results)
        };
    }
};
