/* eslint-disable @typescript-eslint/no-explicit-any */

interface UsageRecord {
    count: number;
    resetTime: number;
}

// Simple In-Memory Store (Per Server Instance)
// In production, use Redis/KV.
const usageStore = new Map<string, UsageRecord>();

// Config
const FREE_TIER_LIMIT = 10; // 10 messages
const COOLDOWN_PERIOD = 60 * 60 * 1000; // 1 Hour

export class RateLimiter {
    
    /**
     * Checks if a user is allowed to use a model based on its tier.
     * Returns error message if blocked, or null if allowed.
     */
    static checkLimit(userId: string, modelId: string, usageTier: 'free' | 'paid'): { allowed: boolean; reason?: string; resetIn?: number } {
        if (usageTier !== 'free') return { allowed: true };

        const key = `${userId}:${modelId}`; // Limit per model per user
        const now = Date.now();
        
        let record = usageStore.get(key);

        // Cleanup expired
        if (record && now > record.resetTime) {
            usageStore.delete(key);
            record = undefined;
        }

        if (!record) {
            // New Window
            usageStore.set(key, { count: 1, resetTime: now + COOLDOWN_PERIOD });
            return { allowed: true };
        }

        if (record.count >= FREE_TIER_LIMIT) {
            const timeLeft = Math.ceil((record.resetTime - now) / 60000);
            return { 
                allowed: false, 
                reason: `Free tier limit reached for ${modelId}. Resets in ${timeLeft} minutes.`,
                resetIn: record.resetTime 
            };
        }

        // Increment
        record.count++;
        usageStore.set(key, record);
        
        return { allowed: true };
    }
    
    static getRemaining(userId: string, modelId: string): number {
        const key = `${userId}:${modelId}`;
        const record = usageStore.get(key);
        if (!record || Date.now() > record.resetTime) return FREE_TIER_LIMIT;
        return Math.max(0, FREE_TIER_LIMIT - record.count);
    }
}
