/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeAutoObservable } from "mobx";
import { getConnectedIntegrations, saveIntegrationConnection, disconnectIntegration as disconnectIntegrationAction } from "@/app/actions/integrations";

export interface ConnectedIntegration {
    integrationName: string;
    strataId: string;
    connectedAt: string;
    lastUsedAt: string;
    metadata?: any;
}

class IntegrationsStore {
    connectedIntegrations: Map<string, ConnectedIntegration> = new Map();
    isLoading = false;

    constructor() {
        makeAutoObservable(this);
    }

    // Load connected integrations from database
    async loadConnectedIntegrations() {
        this.isLoading = true;
        try {
            const response = await getConnectedIntegrations();
            if (response.success && response.integrations) {
                this.connectedIntegrations.clear();
                response.integrations.forEach((integration: any) => {
                    this.connectedIntegrations.set(integration.integration_name, {
                        integrationName: integration.integration_name,
                        strataId: integration.strata_id,
                        connectedAt: integration.connected_at,
                        lastUsedAt: integration.last_used_at,
                        metadata: integration.metadata
                    });
                });
                console.log(`[IntegrationsStore] Loaded ${this.connectedIntegrations.size} connected integrations`);
            }
        } catch (error) {
            console.error("[IntegrationsStore] Failed to load integrations:", error);
        } finally {
            this.isLoading = false;
        }
    }

    // Save integration connection
    async saveConnection(integrationName: string, strataId: string, metadata?: any) {
        const response = await saveIntegrationConnection(integrationName, strataId, metadata);
        if (response.success) {
            this.connectedIntegrations.set(integrationName, {
                integrationName,
                strataId,
                connectedAt: new Date().toISOString(),
                lastUsedAt: new Date().toISOString(),
                metadata
            });
            console.log(`[IntegrationsStore] Saved connection for ${integrationName}`);
        }
        return response;
    }

    // Disconnect integration
    async disconnectIntegration(integrationName: string) {
        const response = await disconnectIntegrationAction(integrationName);
        if (response.success) {
            this.connectedIntegrations.delete(integrationName);
            console.log(`[IntegrationsStore] Disconnected ${integrationName}`);
        }
        return response;
    }

    // Check if integration is connected
    isConnected(integrationName: string): boolean {
        return this.connectedIntegrations.has(integrationName);
    }

    // Get Strata ID for integration
    getStrataId(integrationName: string): string | null {
        return this.connectedIntegrations.get(integrationName)?.strataId || null;
    }
}

export const integrationsStore = new IntegrationsStore();
