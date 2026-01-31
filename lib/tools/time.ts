export function getCurrentTime(timezone?: string): string {
    const now = new Date();
    // Default to system locale/time, or try to use requested timezone
    // Note: To support specific "IST"/"EST" strings reliably across all nodes, we'd need a map or library.
    // For now, we fallback to standard local time or UTC if invalid.
    
    try {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        };
        
        if (timezone) {
            // Map common abbreviations to IANA if needed, or just let Intl try
            // "IST" might be ambiguous (India vs Israel vs Ireland). Best to use "Asia/Kolkata".
            const tzMap: Record<string, string> = {
                "ist": "Asia/Kolkata",
                "est": "America/New_York",
                "pst": "America/Los_Angeles",
                "utc": "UTC"
            };
            const iana = tzMap[timezone.toLowerCase()] || timezone;
            options.timeZone = iana;
        }

        return now.toLocaleString("en-US", options);
    } catch (e) {
        return `Error: Invalid timezone. Local time is ${now.toISOString()}`;
    }
}
