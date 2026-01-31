import { Tool } from "../types";
import { getCurrentTime } from "../time";

export const timeTool: Tool = {
    definition: {
        name: "get_current_time",
        description: "Get the current date and time. Useful for verifying 'today', 'now', or checking timezones (e.g. 'time in India').",
        parameters: {
            type: "object",
            properties: {
                 timezone: { type: "string", description: "Optional timezone abbreviation (IST, EST, etc) or IANA ID." }
            }
        }
    },
    execute: async (args) => {
        const time = getCurrentTime(args.timezone);
        return {
            content: JSON.stringify({ time })
        };
    }
};
