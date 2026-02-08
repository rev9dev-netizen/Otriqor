import { Personality } from "@/lib/api/personalities";
import { chatStore } from "@/lib/store/chat-store";

/**
 * Centralized Prompt Builder looking exactly like the Mistral one.
 * Ensures consistent Persona, Date/Time, and Context injection.
 */
export function constructSystemPrompt(ragContext: string | null, personality: Personality, canvasContent: string | null = null, canvasLanguage: string = "markdown"): string {
    const now = new Date();
    const dateString = now.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeString = now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

    // Inject Personalization (Client-Side Access)
    let personalizationPrompt = "";
    
    // Check for "Base Style" override from Store
    const STYLE_MAP: Record<string, string> = {
          professional: "You are a highly disciplined PROFESSIONAL assistant. Your tone must be POLISHED, PRECISE, and FORMAL. Avoid colloquialisms. Structure your responses for maximum clarity.",
          friendly: "You are a WARM and FRIENDLY assistant. Your tone should be chatty, helpful, and approachable, like a kind colleague.",
          candid: "You are a CANDID assistant. Be DIRECT, ENCOURAGING, and honest. Don't sugarcoat, but be constructive.",
          quirky: "You are a QUIRKY assistant. Be PLAYFUL, IMAGINATIVE, and don't be afraid to use colorful metaphors or slight whimsy.",
          efficient: "You are an EFFICIENT assistant. Be CONCISE and PLAIN. Do not waffle. Get straight to the point.",
          nerdy: "You are a NERDY assistant. Be EXPLORATORY and ENTHUSIASTIC about technical details. Geek out where appropriate.",
          cynical: "You are a CYNICAL assistant. Be CRITICAL and slightly SARCASTIC. Question assumptions and don't be overly optimistic.",
    };

    if (chatStore.baseStyle && chatStore.baseStyle !== 'default') {
        const styleInstruction = STYLE_MAP[chatStore.baseStyle] || `Style/Tone: ${chatStore.baseStyle}`;
        personalizationPrompt += `\n\n### PERSONA INSTRUCTION (CRITICALLY IMPORTANT):\n${styleInstruction}`;
    }

    // Check for Traits
    if (chatStore.characteristics) {
        const chars = Object.entries(chatStore.characteristics)
            .filter(([_, v]) => v !== 'default');
        
        if (chars.length > 0) {
            personalizationPrompt += `\n\n### TRAIT ADJUSTMENTS:`;
            chars.forEach(([k, v]) => {
                const trait = k.replace(/_/g, ' ');
                if (v === 'more') personalizationPrompt += `\n- Be MORE ${trait}.`;
                if (v === 'less') personalizationPrompt += `\n- Be LESS ${trait}.`;
            });
        }
    }

    // Check for User Context
    if (chatStore.aboutYou) {
        const about = [];
        if (chatStore.aboutYou.nickname) about.push(`User Nickname: ${chatStore.aboutYou.nickname}`);
        if (chatStore.aboutYou.occupation) about.push(`User Occupation: ${chatStore.aboutYou.occupation}`);
        if (chatStore.aboutYou.bio) about.push(`User Bio: ${chatStore.aboutYou.bio}`);
        
        if (about.length > 0) {
            personalizationPrompt += `\n\n### USER CONTEXT:\n${about.join('\n')}`;
        }
    }

    // Custom Instructions
    if (chatStore.customInstructions) {
        personalizationPrompt += `\n\n### CUSTOM USER INSTRUCTIONS:\n${chatStore.customInstructions}`;
    }

    return `${personality.systemPrompt}
Current Date: ${dateString}. Current Time: ${timeString}.
${personalizationPrompt}

### CORE INSTRUCTIONS:
` +
           "3. **Structure & Hierarchy**:\n" +
           "   - **Headings**: Use `##` for main sections and `###` for subsections. Create breathing room.\n" +
           "   - **Paragraphs**: Keep them short (max 2-3 lines). Prioritize readability.\n" +
           "   - **Lists**: Group facts logically. Avoid endless bullet lists.\n" +
           "   - **Separators**: AVOID horizontal rules (`---`) unless absolutely necessary. Use whitespace via headers instead.\n" +
           "4. **Citations**:\n" +
           "   - Cite inline unobtrusively using markdown links: `[Source Name](url)`.\n" +
           "   - **NO Footer**: Do **NOT** include a 'Sources' or 'References' list at the end of your response. The user interface handles this automatically.\n" +
           "\n" +
           "### WIDGET RULES (CRITICAL):\n" +
           "- If you have Finance or Weather data, output **ONLY** the JSON block. **DO NOT** write a text summary. **DO NOT** generate image links.\n" +
           "- The Widget replaces the text. Trust the UI.\n\n" +
           "When discussing stocks/crypto, output this JSON block and stop:\n" +
           "```finance\n" +
           "{ \"symbol\": \"AAPL\", \"name\": \"Apple Inc\", \"price\": 258.28, \"currency\": \"USD\", \"change\": 1.25, \"changePercent\": 0.45, \"exchange\": \"NASDAQ\", \"marketStatus\": \"Open\", \"open\": 255.00, \"high\": 260.00, \"low\": 254.00, \"marketCap\": \"3.9T\", \"peRatio\": 30.5, \"dividendYield\": \"0.5%\" }\n" +
           "```\n" +
           "When discussing weather, output this JSON block and stop:\n" +
           "```weather\n" +
           "{ ...full weather json data... }\n" +
           "```\n" +
           "Ensure numeric values are numbers.\n" +
           (ragContext ? "\n\nUse the following retrieved context to answer the user's question:\n" + ragContext : "") +
           (canvasContent ? `\n\n### CANVAS CONTEXT (PREVIOUSLY GENERATED CODE):\nThe user has the following code open in their Canvas editor. This is your "memory" of what they are working on. You can edit this or reference it.\n\n\`\`\`${canvasLanguage}\n${canvasContent}\n\`\`\`\n\nIf the user asks to "fix" or "change" specific lines, refer to the code above.` : "");
}
