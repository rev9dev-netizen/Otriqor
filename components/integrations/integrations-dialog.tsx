/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Grid as GridIcon, ChevronLeft, ExternalLink, Zap, Cable } from "lucide-react";
import { INTEGRATIONS, Integration } from "@/lib/integrations";
import { cn } from "@/lib/utils";
import { integrationsStore } from "@/lib/store/integrations-store";
import { sessionMCPStore } from "@/lib/store/session-mcp-store";
import { Switch } from "@/components/ui/switch";
import { observer } from "mobx-react-lite";
import { toast } from "sonner";

interface IntegrationsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (integration: Integration) => void;
    selectedIds: string[];
}

export const IntegrationsDialog = observer(function IntegrationsDialog({
    open,
    onOpenChange,
    onSelect,
    selectedIds
}: IntegrationsDialogProps) {
    const [search, setSearch] = React.useState("");
    const [selectedIntegration, setSelectedIntegration] = React.useState<Integration | null>(null);
    
    // Convert static list to state
    const [availableIntegrations, setAvailableIntegrations] = React.useState<Integration[]>(INTEGRATIONS);
    const [isLoading, setIsLoading] = React.useState(true);

    // Load connected integrations from database on mount
    React.useEffect(() => {
        integrationsStore.loadConnectedIntegrations();
    }, []);

    React.useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const { fetchKlavisIntegrations } = await import("@/app/actions/integrations");
                const remote = await fetchKlavisIntegrations();
                if (mounted) {
                    // Merge remote with static (prefer remote or de-duplicate)
                    // For now, just append remote ones that aren't already there by ID
                    const newIntegrations = [...INTEGRATIONS];
                    remote.forEach(r => {
                        if (!newIntegrations.find(existing => existing.id === r.id)) {
                            newIntegrations.push(r);
                        }
                    });
                    setAvailableIntegrations(newIntegrations);
                }
            } catch (e) {
                console.error("Failed to load integrations", e);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    const [activeTab, setActiveTab] = React.useState("discover");

    // Reset selection when dialog closes
    React.useEffect(() => {
        if (!open) setSelectedIntegration(null);
    }, [open]);

    const filteredIntegrations = availableIntegrations.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                            item.description.toLowerCase().includes(search.toLowerCase());
        
        // Check connection via multiple formats for "connected" tab
        const isItemConnected = selectedIds.includes(item.id) ||
                              item.isInstalled ||
                              integrationsStore.isConnected(item.id) ||
                              integrationsStore.isConnected(item.id.toUpperCase()) ||
                              integrationsStore.isConnected(item.name) ||
                              integrationsStore.isConnected(item.name.toUpperCase());
        
        const matchesTab = activeTab === "discover" ? true : 
                          activeTab === "connected" ? isItemConnected :
                          activeTab === "custom" ? !item.isOfficial : true;
        
        return matchesSearch && matchesTab;
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 bg-[#121212] text-neutral-100 border-neutral-800 sm:rounded-2xl overflow-hidden focus:outline-none outline-none">
                
                {/* Header (Dynamic based on view) */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#121212] z-10 shrink-0">
                    <div className="flex items-center gap-2">
                         {selectedIntegration ? (
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setSelectedIntegration(null)}
                                className="h-8 px-2 -ml-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg gap-1"
                             >
                                 <ChevronLeft className="h-4 w-4" />
                                 Back
                             </Button>
                         ) : (
                             <>
                                <Cable className="h-5 w-5 text-indigo-500" />
                                <DialogTitle className="text-lg font-semibold text-neutral-100">Connector Store</DialogTitle>
                             </>
                         )}
                    </div>
                    {/* Close button provided by DialogPrimitive, but we add custom if needed */}
                </div>

                {/* Content Area */}
                {selectedIntegration ? (
                     <IntegrationDetailsView 
                        integration={selectedIntegration} 
                        isInstalled={selectedIds.includes(selectedIntegration.id)}
                        onInstall={() => onSelect(selectedIntegration)}
                     />
                ) : (
                    <IntegrationListView 
                        items={filteredIntegrations}
                        isLoading={isLoading}
                        search={search}
                        setSearch={setSearch}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        selectedIds={selectedIds}
                        onSelect={onSelect}
                        onViewDetails={setSelectedIntegration}
                    />
                )}

            </DialogContent>
        </Dialog>
    );
});

// ----------------------------------------------------------------------
// Sub-Components
// ----------------------------------------------------------------------

const IntegrationListView = observer(function IntegrationListView({ items, isLoading, search, setSearch, activeTab, setActiveTab, selectedIds, onSelect, onViewDetails }: any) {
    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#121212]">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-[#121212] shrink-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                    <TabsList className="bg-neutral-900 border border-neutral-800 text-neutral-400">
                        <TabsTrigger value="discover" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white">Discover</TabsTrigger>
                        <TabsTrigger value="connected" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white">Connected</TabsTrigger>
                        <TabsTrigger value="custom" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white">Custom</TabsTrigger>
                    </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                        <Input 
                            placeholder="Search skills..." 
                            className="pl-9 h-9 bg-neutral-900 border-neutral-800 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-neutral-200 placeholder:text-neutral-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    </div>
            </div>

            {/* Grid */}
            <ScrollArea className="flex-1 p-6">
                {isLoading ? (
                     <div className="h-full flex items-center justify-center text-neutral-500">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-5 w-5 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-medium tracking-wide">LOADING STORE...</span>
                        </div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-sm gap-2">
                        <span>No skills found matching your search.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item: Integration) => {
                            // Check connection via multiple formats (id, name, uppercase name)
                            const isConnected = selectedIds.includes(item.id) || 
                                               item.isInstalled ||
                                               integrationsStore.isConnected(item.id) ||
                                               integrationsStore.isConnected(item.id.toLowerCase()) ||
                                               integrationsStore.isConnected(item.id.toUpperCase()) ||
                                               integrationsStore.isConnected(item.name) ||
                                               integrationsStore.isConnected(item.name.toUpperCase());
                            return (
                                <div 
                                    key={item.id} 
                                    onClick={() => onViewDetails(item)}
                                    className="group flex flex-col justify-between p-4 rounded-xl bg-[#1c1c1c] border border-neutral-800 hover:border-neutral-700 hover:shadow-lg transition-all duration-200 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-neutral-800 overflow-hidden group-hover:scale-105 transition-transform">
                                                {typeof item.icon === 'string' ? (
                                                    <img src={item.icon} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <item.icon className="h-6 w-6 text-neutral-200" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-neutral-100">{item.name}</h3>
                                                <span className="text-[10px] text-neutral-500 uppercase font-medium tracking-wider">{item.category}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Toggle or Plus Button */}
                                        {isConnected ? (
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Switch
                                                    checked={sessionMCPStore.isEnabled(item.id)}
                                                    onCheckedChange={(enabled) => {
                                                        sessionMCPStore.setEnabled(item.id, enabled);
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 hover:bg-neutral-800 text-neutral-400 hover:text-white"
                                                onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    onSelect(item);
                                                }}
                                            >
                                                <Plus className="h-5 w-5" />
                                            </Button>
                                        )}
                                    </div>
                                    
                                    <p className="text-xs text-neutral-400 line-clamp-2 h-8 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
});

const IntegrationDetailsView = observer(function IntegrationDetailsView({ integration, isInstalled, onInstall }: { integration: Integration, isInstalled: boolean, onInstall: () => void }) {
    const [isConnecting, setIsConnecting] = React.useState(false);
    const [isDisconnecting, setIsDisconnecting] = React.useState(false);
    const isEnabled = sessionMCPStore.isEnabled(integration.id);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            // Import and call the server action
            const { connectIntegration } = await import("@/app/actions/connect");
            // Use name as server identifier (heuristic, Klavis usually wants uppercase name)
            const result = await connectIntegration(integration.name.toUpperCase());

            if (result.status === "auth_required") {
                // Open auth URL in new tab
                window.open(result.authUrl, "_blank");
                // Optimistically mark as installed or wait for user confirmation?
                // For now, let's assume if they clicked the link, they are "connecting"
                // Ideally, we'd poll or wait, but simpler flow:
                onInstall(); // Mark UI as connected
            } else if (result.status === "connected") {
                onInstall();
                
                // Refresh tools
                const { initKlavisTools } = await import("@/lib/tools/klavis-loader");
                await initKlavisTools();
                toast.success("Connected and tools loaded!");
            } else {
                alert(result.message);
            }
        } catch (e) {
            console.error("Connection failed", e);
            alert("Failed to connect. See console.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm(`Disconnect ${integration.name}? You'll need to re-authenticate to use it again.`)) {
            return;
        }
        
        setIsDisconnecting(true);
        try {
            await integrationsStore.disconnectIntegration(integration.id.toLowerCase());
            sessionMCPStore.setEnabled(integration.id, false);
            toast.success(`${integration.name} disconnected`);
            // Force re-render by calling onInstall (which toggles the state)
            // This is a bit hacky, but works for now
            window.location.reload();
        } catch (e) {
            console.error("Disconnect failed", e);
            toast.error("Failed to disconnect");
        } finally {
            setIsDisconnecting(false);
        }
    };

    return (
        <ScrollArea className="flex-1 h-full bg-[#121212]">
            <div className="p-8 max-w-3xl mx-auto">
                {/* Hero */}
                <div className="flex items-start justify-between mb-8">
                    <div className="flex gap-6">
                        <div className="h-24 w-24 rounded-3xl bg-neutral-800 overflow-hidden shadow-2xl shrink-0">
                             {typeof integration.icon === 'string' ? (
                                <img src={integration.icon} alt={integration.name} className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <integration.icon className="h-10 w-10 text-neutral-400" />
                                </div>
                             )}
                        </div>
                        <div className="pt-2">
                            <h1 className="text-2xl font-bold text-white mb-2">{integration.name}</h1>
                            <p className="text-neutral-400 text-sm">{integration.description}</p>
                        </div>
                    </div>
                    
                    {/* Connect or Disconnect Button */}
                    {isInstalled ? (
                        <Button 
                            onClick={handleDisconnect}
                            disabled={isDisconnecting}
                            variant="outline"
                            className="min-w-[140px] border-red-600/50 text-red-500 hover:bg-red-600/10 hover:text-red-400"
                        >
                            {isDisconnecting ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                    <span>Disconnecting...</span>
                                </div>
                            ) : "Disconnect"}
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="min-w-[140px] bg-white text-black hover:bg-neutral-200"
                        >
                            {isConnecting ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
                                    <span>Connecting...</span>
                                </div>
                            ) : "Connect"}
                        </Button>
                    )}
                </div>

                {/* Enable for AI Section - Only shown when connected */}
                {isInstalled && (
                    <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700 mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                                    isEnabled ? "bg-green-500/20" : "bg-neutral-700"
                                )}>
                                    <Zap className={cn(
                                        "h-5 w-5 transition-colors",
                                        isEnabled ? "text-green-400" : "text-neutral-400"
                                    )} />
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-100">Enable for AI</p>
                                    <p className="text-xs text-neutral-400">
                                        {isEnabled 
                                            ? "Nova can use these tools in conversations" 
                                            : "Toggle on to let Nova use these tools"}
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={isEnabled}
                                onCheckedChange={(enabled) => {
                                    sessionMCPStore.setEnabled(integration.id, enabled);
                                    toast.success(enabled 
                                        ? `${integration.name} enabled for this session` 
                                        : `${integration.name} disabled`
                                    );
                                }}
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-8">
                    {/* Description */}
                    <div className="text-neutral-300 text-sm leading-relaxed">
                        {integration.longDescription || integration.description}
                    </div>

                    {/* Tools */}
                    {integration.tools && (
                        <div>
                             <h3 className="text-sm font-semibold text-neutral-200 mb-3 flex items-center gap-2">
                                Tools <span className="bg-neutral-800 text-neutral-400 text-[10px] px-2 py-0.5 rounded-full">{integration.tools.length}</span>
                             </h3>
                             <div className="flex flex-wrap gap-2">
                                 {integration.tools.map((tool) => (
                                     <span key={tool} className="px-3 py-1.5 rounded-lg bg-[#1c1c1c] border border-neutral-800 text-xs text-neutral-400 font-mono">
                                         {tool}
                                     </span>
                                 ))}
                             </div>
                             <Button variant="link" className="text-xs text-neutral-500 p-0 h-auto mt-2">View all</Button>
                        </div>
                    )}

                    <div className="h-px bg-neutral-800 w-full my-6" />

                    {/* Details Table */}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-200 mb-4">Details</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-12 max-w-lg">
                            <div>
                                <h4 className="text-xs font-medium text-neutral-500 mb-1">Version</h4>
                                <p className="text-sm text-neutral-300">{integration.version || "1.0.0"}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-medium text-neutral-500 mb-1">Author</h4>
                                <a href="#" className="text-sm text-neutral-300 hover:underline flex items-center gap-1">
                                    {integration.author || "Community"}
                                    <ExternalLink className="h-3 w-3 opacity-50" />
                                </a>
                            </div>
                             <div>
                                <h4 className="text-xs font-medium text-neutral-500 mb-1">More info</h4>
                                <div className="flex flex-col gap-1">
                                    <a href={integration.website || "#"} className="text-sm text-neutral-300 hover:underline flex items-center gap-1">
                                        Documentation
                                        <ExternalLink className="h-3 w-3 opacity-50" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
});
