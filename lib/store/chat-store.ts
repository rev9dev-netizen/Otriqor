/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeAutoObservable, observable } from "mobx";
import { v4 as uuidv4 } from "uuid";

export type Role = "user" | "assistant" | "system" | "tool";

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
  role: Role;
  name?: string;
  content: string;
  attachments?: Attachment[];
  citations?: any; // JSONB storage for tool results/sources
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
  currentLeafId: string | null = null; // The active "latest" message
  chatId: string | null = null; // Supabase Chat ID
  isGenerating: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  setChatId(id: string) {
    this.chatId = id;
  }

  setIsGenerating(isGenerating: boolean) {
    this.isGenerating = isGenerating;
  }

  isAnalyzing: boolean = false;
  
  activeCitations: any[] | null = null;
  
  setIsAnalyzing(isAnalyzing: boolean) {
    this.isAnalyzing = isAnalyzing;
  }

  setActiveCitations(citations: any[] | null) {
    this.activeCitations = citations;
  }

  // Add a message to the active conversation path
  addMessage(role: Role, content: string, parentId: string | null = null, id: string | null = null, attachments?: Attachment[], citations?: any) {
    console.log("ChatStore.addMessage:", { role, content, attachments, citations });
    const messageId = id || uuidv4();
    const message: MessageNode = {
      id: messageId,
      parentId: parentId || this.currentLeafId,
      childrenIds: [],
      role,
      content,
      attachments,
      citations,
      createdAt: Date.now(),
      stats: undefined // Explicitly undefined initially
    };

    this.messages.set(messageId, message);

    // If this is the first message (root)
    if (!this.headId) {
      this.headId = messageId;
    } else if (message.parentId) {
      const parent = this.messages.get(message.parentId);
      if (parent) {
        parent.childrenIds.push(messageId);
      }
    }

    this.currentLeafId = messageId;
    return messageId;
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

  // Branching: Switch to a different sibling node
  navigateToSibling(nodeId: string, direction: "prev" | "next") {
    const node = this.messages.get(nodeId);
    if (!node || !node.parentId) return;

    const parent = this.messages.get(node.parentId);
    if (!parent) return;

    const currentIndex = parent.childrenIds.indexOf(nodeId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    // Circular navigation or clamp? Let's clamp for now
    if (targetIndex < 0 || targetIndex >= parent.childrenIds.length) return;

    const targetSiblingId = parent.childrenIds[targetIndex];
    
    // We need to find the leaf of this new branch. 
    // For simplicity in this v1, we just take the target sibling 
    // and walk down its first child until the end.
    let leaf = this.messages.get(targetSiblingId);
    while (leaf && leaf.childrenIds.length > 0) {
      leaf = this.messages.get(leaf.childrenIds[leaf.childrenIds.length - 1]);
    }
    
    if (leaf) {
      this.currentLeafId = leaf.id;
    }
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

  reset() {
    this.messages.clear();
    this.headId = null;
    this.currentLeafId = null;
    this.chatId = null;
    this.isGenerating = false;
  }
}

export const chatStore = new ChatStore();
