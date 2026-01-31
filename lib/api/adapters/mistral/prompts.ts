import { Personality } from "@/lib/api/personalities";

export function constructSystemPrompt(ragContext: string | null, personality: Personality): string {
    const now = new Date();
    const dateString = now.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeString = now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

    return `${personality.systemPrompt}
Current Date: ${dateString}. Current Time: ${timeString}.

### CORE INSTRUCTIONS:
` +
           "3. **Structure & Hierarchy**:\n" +
           "   - **Headings**: Use `##` for main sections and `###` for subsections. Create breathing room.\n" +
           "   - **Paragraphs**: Keep them short (max 2-3 lines). Prioritize readability.\n" +
           "   - **Lists**: Group facts logically. Avoid endless bullet lists.\n" +
           "   - **Separators**: AVOID horizontal rules (`---`) unless absolutely necessary. Use whitespace via headers instead.\n" +
           /* DISABLED: Gallery
           "3. **Multimedia (Images)**:\n" +
           "   - **Mandatory Gallery**: For visual topics (people, places, cars, products), you **MUST** include a `gallery` block with **4-6 diverse images**.\n" +
           "   - **Do NOT** output a single image for these topics. Dig into the search results to find more.\n" +
           "     ```gallery\n" +
           "     ![Alt 1](url1)\n" +
           "     ![Alt 2](url2)\n" +
           "     ![Alt 3](url3)\n" +
           "     ![Alt 4](url4)\n" +
           "     ```\n" +
           "   - **Placement**: Place the gallery *immediately after* the introductory paragraph.\n" +
           */
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
           (ragContext ? "\n\nUse the following retrieved context to answer the user's question:\n" + ragContext : "");
}
