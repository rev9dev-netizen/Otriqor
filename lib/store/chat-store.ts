/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeAutoObservable, observable } from "mobx";
import { v4 as uuidv4 } from "uuid";
import { PERSONALITIES, DEFAULT_PERSONALITY, Personality } from "@/lib/api/personalities";

export type Role = "user" | "assistant" | "system" | "tool";

export interface ReasoningStep {
  id: string;
  thought: string;
  status: "thinking" | "done";
  timestamp: number;
  toolName?: string;
  toolArgs?: any;
  toolResult?: string;
}

export interface Attachment {
  id?: string; // Server-side File ID
  name: string;
  type: string; // e.g. "image/png", "application/pdf"
  url: string; // Base64 or Blob URL for preview
  content?: string; // Base64 data or text content for AI processing
}

export interface MessageNode {
  id: string;
  parentId: string | null;
  childrenIds: string[];
  activeChildId: string | null; // Track which child is "selected" for the path
  role: Role;
  name?: string;
  content: string;
  attachments?: Attachment[];
  tool_calls?: any[]; 
  tool_results?: any[]; 
  citations?: any; 
  reasoningSteps?: ReasoningStep[]; // Persisted reasoning steps
  activeIntegration?: { name: string; icon: string }; // Persisted integration info
  createdAt: number;
  feedback?: "like" | "dislike" | null;
  stats?: {
    tokensPerSec: number;
    totalTokens: number;
    timeToFirstToken: number;
    stopReason: string;
  };
}

class ChatStore {
  messages = observable.map<string, MessageNode>(); // Explicit observable map
  headId: string | null = null;
  rootChildrenIds: string[] = []; // Track root-level versions
  currentLeafId: string | null = null; // The active "latest" message
  chatId: string | null = null; // Supabase Chat ID
  title: string | null = null; // Observable Title
  personality: Personality = DEFAULT_PERSONALITY; // AI Personality
  isGenerating: boolean = false;

  constructor() {
    makeAutoObservable(this);
    this.hydrateSettings();
  }

  setTitle(title: string) {
      this.title = title;
  }

  hydrateSettings() {
      if (typeof window !== 'undefined') {
          const savedStyle = localStorage.getItem('zod_baseStyle');
          if (savedStyle) this.baseStyle = savedStyle;

          const savedChars = localStorage.getItem('zod_characteristics');
          if (savedChars) this.characteristics = JSON.parse(savedChars);

          const savedAbout = localStorage.getItem('zod_aboutYou');
          if (savedAbout) this.aboutYou = JSON.parse(savedAbout);

          const savedAdvanced = localStorage.getItem('zod_advanced');
          if (savedAdvanced) this.advanced = JSON.parse(savedAdvanced);
          
          const savedInstructions = localStorage.getItem('zod_customInstructions');
          if (savedInstructions) this.customInstructions = savedInstructions;
      }
  }

  setChatId(id: string) {
    this.chatId = id;
  }
  
  setPersonality(personality: Personality) {
      this.personality = personality;
  }

  async loadPreferences() {
      // Dynamic import to avoid circular dep if needed, or just standard import
      const { fetchUserPreferences } = await import("@/lib/supabase/db");
      const prefs = await fetchUserPreferences();
      if (prefs && prefs.personalityId) {
          const p = PERSONALITIES.find(x => x.id === prefs.personalityId);
          if (p) {
              this.setPersonality(p);
          }
      }
  }

  setIsGenerating(isGenerating: boolean) {
    this.isGenerating = isGenerating;
  }

  isAnalyzing: boolean = false;
  isSearching: boolean = false; 
  currentToolExecution: { name: string; label: string } | null = null;
  
  activeCitations: any[] | null = null;
  
  setIsAnalyzing(isAnalyzing: boolean) {
    this.isAnalyzing = isAnalyzing;
  }

  setIsSearching(isSearching: boolean) {
    this.isSearching = isSearching;
  }

  setCurrentToolExecution(tool: { name: string; label: string } | null) {
    this.currentToolExecution = tool;
  }

  isActiveIntegrationOpen: boolean = false;
  activeIntegration: { id: string; label: string; icon: string | any } | null = null;
  
  setIsActiveIntegrationOpen(open: boolean) {
      this.isActiveIntegrationOpen = open;
  }

  setActiveIntegrationDraft(integration: { id: string; label: string; icon: string | any } | null) {
      this.activeIntegration = integration;
  }

  setActiveCitations(citations: any[] | null) {
    this.activeCitations = citations;
  }

  // Settings State
  customInstructions: string = "";
  memoryEnabled: boolean = true;


  setCustomInstructions(instructions: string) {
      this.customInstructions = instructions;
      if (typeof window !== 'undefined') localStorage.setItem('zod_customInstructions', instructions);
  }

  setMemoryEnabled(enabled: boolean) {
      this.memoryEnabled = enabled;
  }

  // Personalization State
  baseStyle: string = "default";
  characteristics: Record<string, string> = {}; 
  aboutYou: { nickname: string; occupation: string; bio: string } = {
      nickname: "",
      occupation: "",
      bio: ""
  };
  advanced: {
      webSearch: boolean;
      codeInterpreter: boolean;
      canvas: boolean;
      voice: boolean;
      advancedVoice: boolean;
      connectorSearch: boolean;
  } = {
      webSearch: true,
      codeInterpreter: true,
      canvas: true,
      voice: true,
      advancedVoice: true,
      connectorSearch: false
  };

  setBaseStyle(style: string) {
      this.baseStyle = style;
      if (typeof window !== 'undefined') localStorage.setItem('zod_baseStyle', style);
  }

  setCharacteristic(key: string, value: string) {
      this.characteristics = { ...this.characteristics, [key]: value };
      if (typeof window !== 'undefined') localStorage.setItem('zod_characteristics', JSON.stringify(this.characteristics));
  }

  setAboutYou(field: keyof typeof this.aboutYou, value: string) {
      this.aboutYou = { ...this.aboutYou, [field]: value };
      if (typeof window !== 'undefined') localStorage.setItem('zod_aboutYou', JSON.stringify(this.aboutYou));
  }

  setAdvanced(field: keyof typeof this.advanced, value: boolean) {
      this.advanced = { ...this.advanced, [field]: value };
      if (typeof window !== 'undefined') localStorage.setItem('zod_advanced', JSON.stringify(this.advanced));
  }

  // Add a message to the active conversation path
  addMessage(role: Role, content: string, parentId: string | null = null, id: string | null = null, attachments?: Attachment[], citations?: any) {
    console.log("ChatStore.addMessage:", { role, content, attachments, citations });
    const messageId = id || uuidv4();
    const effectiveParentId = parentId || this.currentLeafId;

    // Special case: If this is the VERY first message explicitly (no parent, no current leaf), it's a root
    // OR if explicit parentId is null (forcing a root)
    const isRoot = parentId === null && (this.currentLeafId === null || role === "user"); 
    // Actually, simple rule: if parentId is null, it's a root.
    // BUT addMessage defaults parentId to currentLeafId.
    // So if we WANT a root, we must pass null explicitly? 
    // Let's stick to: if effectiveParentId is null, it's a root.

    const finalParentId = effectiveParentId;

    const message: MessageNode = {
      id: messageId,
      parentId: finalParentId,
      childrenIds: [],
      activeChildId: null,
      role,
      content,
      attachments,
      citations,
      createdAt: Date.now(),
      stats: undefined 
    };

    this.messages.set(messageId, message);

    if (finalParentId) {
      // Child node
      const parent = this.messages.get(finalParentId);
      if (parent) {
        parent.childrenIds.push(messageId);
        parent.activeChildId = messageId; 
      }
    } else {
      // Root node
      this.rootChildrenIds.push(messageId);
      // If we don't have a head yet, or we're adding a new root version?
      // For addMessage (linear), usually we just set headId if empty.
      if (!this.headId) {
        this.headId = messageId;
      }
    }

    this.currentLeafId = messageId;
    return messageId;
  }

  // Create a new version (sibling) of a message
  createVersion(nodeId: string, newContent: string): string | null {
      const originalNode = this.messages.get(nodeId);
      if (!originalNode) return null;

      const newVersionId = uuidv4();
      const newVersion: MessageNode = {
          ...originalNode,
          id: newVersionId,
          childrenIds: [], 
          activeChildId: null,
          content: newContent,
          createdAt: Date.now(),
          stats: undefined,
          tool_calls: undefined, 
          tool_results: undefined,
          citations: undefined
      };

      this.messages.set(newVersionId, newVersion);
      
      if (originalNode.parentId) {
          // Standard case: has parent
          const parent = this.messages.get(originalNode.parentId);
          if (parent) {
              parent.childrenIds.push(newVersionId);
              parent.activeChildId = newVersionId;
          }
      } else {
          // Root case: no parent
          this.rootChildrenIds.push(newVersionId);
          this.headId = newVersionId; // Switch active root
      }

      // Update global leaf
      this.currentLeafId = newVersionId;
      return newVersionId;
  }

  // Find the deepest active leaf from a given node
  findActiveLeaf(startNodeId: string): string {
      let current = this.messages.get(startNodeId);
      while (current && current.activeChildId) {
          const next = this.messages.get(current.activeChildId);
          if (next) {
              current = next;
          } else {
              break;
          }
      }
      return current ? current.id : startNodeId;
  }

  navigateBranch(nodeId: string, direction: "prev" | "next") {
      const node = this.messages.get(nodeId);
      if (!node) return;

      let siblings: string[] = [];
      let currentIndex = -1;

      if (node.parentId) {
          const parent = this.messages.get(node.parentId);
          if (parent) {
              siblings = parent.childrenIds;
          }
      } else {
          // Is Root
          siblings = this.rootChildrenIds;
      }

      currentIndex = siblings.indexOf(nodeId);
      if (currentIndex === -1) return;

      const targetIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex >= 0 && targetIndex < siblings.length) {
          const targetSiblingId = siblings[targetIndex];
          
          if (node.parentId) {
              const parent = this.messages.get(node.parentId);
              if (parent) parent.activeChildId = targetSiblingId;
          } else {
              // Switch Root
              this.headId = targetSiblingId;
          }

          // Find the end of this branch (restore history state)
          this.currentLeafId = this.findActiveLeaf(targetSiblingId);
      }
  }

  // Get the full conversation thread from root to the current leaf
  get thread(): MessageNode[] {
    const thread: MessageNode[] = [];
    if (!this.currentLeafId) return thread;

    let current: MessageNode | undefined = this.messages.get(this.currentLeafId);
    while (current) {
      thread.unshift(current);
      if (current.parentId) {
        current = this.messages.get(current.parentId);
      } else {
        current = undefined;
      }
    }
    return thread;
  }

  updateMessageContent(id: string, content: string) {
    const message = this.messages.get(id);
    if (message) {
      this.messages.set(id, { ...message, content });
    }
  }

  updateMessageCitations(id: string, citations: any) {
    const message = this.messages.get(id);
    if (message) {
      this.messages.set(id, { ...message, citations });
    }
  }

  updateMessageToolCalls(id: string, tool_calls: any[]) {
      const message = this.messages.get(id);
      if (message) {
          const calls = Array.isArray(tool_calls) ? tool_calls : [tool_calls];
          const existing = message.tool_calls || [];
          this.messages.set(id, { ...message, tool_calls: [...existing, ...calls] });
      }
  }

  updateMessageToolResults(id: string, tool_result: any) {
      const message = this.messages.get(id);
      if (message) {
          const existing = message.tool_results || [];
          this.messages.set(id, { ...message, tool_results: [...existing, tool_result] });
      }
  }

  updateMessageStats(id: string, stats: Required<MessageNode>['stats']) {
    const message = this.messages.get(id);
    if (message) {
      this.messages.set(id, { ...message, stats });
    }
  }

  setFeedback(id: string, feedback: "like" | "dislike" | null) {
    const message = this.messages.get(id);
    if (message) {
      this.messages.set(id, { ...message, feedback });
    }
  }

  // Reasoning Steps Management
  addReasoningStep(messageId: string, step: ReasoningStep) {
    const message = this.messages.get(messageId);
    if (message) {
      const existing = message.reasoningSteps || [];
      // Avoid duplicates if id exists
      if (!existing.find(s => s.id === step.id)) {
          this.messages.set(messageId, { 
              ...message, 
              reasoningSteps: [...existing, step] 
          });
      }
    }
  }

  updateReasoningStepStatus(messageId: string, stepId: string, status: "thinking" | "done") {
      const message = this.messages.get(messageId);
      if (message && message.reasoningSteps) {
          const newSteps = message.reasoningSteps.map(s => 
              s.id === stepId ? { ...s, status } : s
          );
          this.messages.set(messageId, { 
              ...message, 
              reasoningSteps: newSteps 
          });
      }
  }

  setActiveIntegration(messageId: string, info: { name: string; icon: string }) {
      const message = this.messages.get(messageId);
      if (message) {
          this.messages.set(messageId, { ...message, activeIntegration: info });
      }
  }

  reset() {
    this.messages.clear();
    this.rootChildrenIds = [];
    this.headId = null;
    this.currentLeafId = null;
    this.chatId = null;
    this.isGenerating = false;
  }
}

export const chatStore = new ChatStore();
