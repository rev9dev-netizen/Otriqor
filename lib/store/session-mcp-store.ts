import { makeAutoObservable } from "mobx";

export interface IntegrationInfo {
    id: string;
    name: string;
    icon: string;
}

export interface EnableRequest {
    integration: IntegrationInfo;
    action: string;
    resolve: (enabled: boolean) => void;
}

/**
 * Session MCP Store
 * 
 * Manages which MCPs are ENABLED for the current chat session.
 * - Connect/Disconnect = permanent OAuth auth (managed by integrationsStore)
 * - Enable/Disable = per-session activation (managed here)
 * 
 * RULE: All MCPs start DISABLED on new chat. User must enable explicitly.
 */
class SessionMCPStore {
    // MCPs enabled for current session (lowercase IDs)
    enabledMCPs: Set<string> = new Set();
    
    // Pending enable request for in-chat prompt
    pendingEnableRequest: EnableRequest | null = null;
    
    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Check if an integration is enabled for this session
     */
    isEnabled(integrationId: string): boolean {
        return this.enabledMCPs.has(integrationId.toLowerCase());
    }

    /**
     * Set enabled state (from Connector Store toggle or chat prompt)
     */
    setEnabled(integrationId: string, enabled: boolean): void {
        const id = integrationId.toLowerCase();
        if (enabled) {
            this.enabledMCPs.add(id);
            console.log(`[SessionMCP] Enabled: ${id}`);
        } else {
            this.enabledMCPs.delete(id);
            console.log(`[SessionMCP] Disabled: ${id}`);
        }
    }

    /**
     * Toggle enabled state
     */
    toggle(integrationId: string): void {
        const id = integrationId.toLowerCase();
        if (this.enabledMCPs.has(id)) {
            this.enabledMCPs.delete(id);
            console.log(`[SessionMCP] Toggled OFF: ${id}`);
        } else {
            this.enabledMCPs.add(id);
            console.log(`[SessionMCP] Toggled ON: ${id}`);
        }
    }

    /**
     * Request enable from executor (shows prompt in UI)
     * Returns promise that resolves when user responds
     */
    async requestEnable(integration: IntegrationInfo, action: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.pendingEnableRequest = { integration, action, resolve };
        });
    }

    /**
     * User responds to enable request
     */
    respondToRequest(enabled: boolean): void {
        if (this.pendingEnableRequest) {
            const { integration, resolve } = this.pendingEnableRequest;
            
            if (enabled) {
                this.enabledMCPs.add(integration.id.toLowerCase());
                console.log(`[SessionMCP] User enabled: ${integration.id}`);
            } else {
                console.log(`[SessionMCP] User declined: ${integration.id}`);
            }
            
            resolve(enabled);
            this.pendingEnableRequest = null;
        }
    }

    /**
     * Dismiss pending request without action
     */
    dismissRequest(): void {
        if (this.pendingEnableRequest) {
            this.pendingEnableRequest.resolve(false);
            this.pendingEnableRequest = null;
        }
    }

    /**
     * Get all enabled integration IDs
     */
    getEnabledIds(): string[] {
        return Array.from(this.enabledMCPs);
    }

    /**
     * Get count of enabled MCPs
     */
    get enabledCount(): number {
        return this.enabledMCPs.size;
    }

    /**
     * Reset session - called on new chat
     * All MCPs start disabled by default
     */
    resetSession(): void {
        this.enabledMCPs.clear();
        this.pendingEnableRequest = null;
        console.log(`[SessionMCP] Session reset - all MCPs disabled`);
    }
}

export const sessionMCPStore = new SessionMCPStore();
