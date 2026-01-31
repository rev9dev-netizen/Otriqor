import { Tool } from "../types";
import { getWeather } from "../weather";

export const weatherTool: Tool = {
    definition: {
        name: "get_weather",
        description: "Get real-time weather and forecast for a specific city.",
        parameters: {
            type: "object",
            properties: {
                city: { type: "string", description: "The city name (e.g. 'San Francisco', 'London')" }
            },
            required: ["city"]
        }
    },
    execute: async (args) => {
        const data = await getWeather(args.city);
        return {
            content: JSON.stringify(data)
        };
    }
};
