export interface Integration {
    id: string;
    name: string;
    description: string;
    icon: any; // URL (string) or React Component (LucideIcon)
    category: "browse" | "productivity" | "development" | "financial" | "creative" | "utility";
    isInstalled?: boolean;
    isOfficial?: boolean;
    
    // Details View Data
    author?: string;
    version?: string;
    website?: string;
    tools?: string[]; // List of tool names this integration provides
    longDescription?: string;
}

export const INTEGRATIONS: Integration[] = [
    {
        id: "gmail",
        name: "Gmail",
        description: "Gmail is a free email service provided by Google.",
        longDescription: "The Gmail MCP server enables AI agents to interact with your Gmail account. It allows for reading threads, drafting replies, searching messages, and managing labels programmatically. This integration puts your inbox at the center of your AI workflow.",
        icon: "https://cdn.brandfetch.io/domain/gmail.com/w/400/h/400?c=1id05yjbcK2xcWSgXSu",
        category: "productivity",
        author: "Google",
        version: "1.0.0",
        website: "https://gmail.com",
        tools: [
            "read_recent_emails",
            "search_emails",
            "create_draft",
            "send_email",
            "get_thread",
            "archive_thread",
            "add_label"
        ]
    }
];
