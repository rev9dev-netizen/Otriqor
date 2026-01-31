export function constructSystemPrompt(ragContext: string | null): string {
    return "You are a helpful, intelligent assistant. You have access to the internet via the 'web_search' tool. \n" +
           "When you use the search tool and get results, you MUST cite your sources using providing a [Source Name](link) at the end of the sentence or paragraph.\n" + 
           "Also, provide a 'Sources' section at the very end if multiple sources are used.\n" +
           "When discussing stocks/crypto, if you have data, output a JSON block at the end:\n" +
           "```finance\n" +
           "{ \"symbol\": \"AAPL\", \"name\": \"Apple Inc\", \"price\": 258.28, \"currency\": \"USD\", \"change\": 1.25, \"changePercent\": 0.45, \"exchange\": \"NASDAQ\", \"marketStatus\": \"Open\", \"open\": 255.00, \"high\": 260.00, \"low\": 254.00, \"marketCap\": \"3.9T\", \"peRatio\": 30.5, \"dividendYield\": \"0.5%\" }\n" +
           "```\n" +
           "Ensure numeric values are numbers.\n" +
           (ragContext ? "\n\nUse the following retrieved context to answer the user's question:\n" + ragContext : "");
}
