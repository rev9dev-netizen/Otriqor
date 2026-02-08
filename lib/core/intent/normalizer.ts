/* eslint-disable @typescript-eslint/no-explicit-any */
import { ToolCallAction, ErrorAction } from "../contracts/action";

/**
 * Validates and transforms raw model outputs into strict ActionAST.
 * This ensures the Runtime never crashes on malformed inputs.
 */
export class IntentNormalizer {

    /**
     * Normalizes a raw tool call object from an adapter into a strict ToolCallAction.
     * Handles JSON parsing of arguments and ID generation.
     */
    static normalizeToolCall(raw: any): ToolCallAction | ErrorAction {
        try {
            if (!raw || typeof raw !== 'object') {
                return { type: "error", reason: "Invalid raw input: must be object", recoverable: false, rawInput: raw };
            }

            // Mistral/OpenAI structure: { function: { name, arguments }, id }
            // Internal structure fallback: { name, args, id }
            const funcObj = raw.function || raw;
            const name = funcObj.name || raw.name;

            if (!name || typeof name !== 'string') {
                return { type: "error", reason: "Missing tool name", recoverable: true, rawInput: raw };
            }

            let args = funcObj.arguments || funcObj.args || raw.args || {};
            
            // Defensively parse string arguments
            if (typeof args === 'string') {
                try {
                    // Handle edge case where model outputs unescaped newlines or bad JSON
                    args = JSON.parse(args);
                } catch {
                     // recoverable: true means we might prompt the model to fix it
                     return { type: "error", reason: `Invalid JSON in arguments for tool '${name}'`, recoverable: true, rawInput: raw };
                }
            }

            return {
                type: "tool_call",
                tool: name,
                args: args,
                id: raw.id || Math.random().toString(36).substr(2, 9).replace(/[^a-zA-Z0-9]/g, 'x')
            };

        } catch (e: any) {
            return { type: "error", reason: e.message || "Unknown Normalization Error", recoverable: false };
        }
    }
}
