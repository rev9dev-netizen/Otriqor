import { makeAutoObservable } from "mobx";

class CanvasStore {
    isOpen = false;
    content = "";
    language = "markdown";
    isVisible = false; // For animation purposes maybe?

    chatId: string | null = null;
    saveTimer: NodeJS.Timeout | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    setChatId(id: string | null) {
        this.chatId = id;
    }

    setIsOpen(isOpen: boolean) {
        this.isOpen = isOpen;
    }

    setContent(content: string) {
        this.content = content;
        this.triggerAutoSave();
    }

    setLanguage(language: string) {
        this.language = language;
        this.triggerAutoSave();
    }

    openWithContent(content: string, language: string = "markdown") {
        this.content = content;
        this.language = language;
        this.isOpen = true;
        this.triggerAutoSave();
    }

    reset() {
        this.isOpen = false;
        this.content = "";
        this.language = "markdown";
        this.chatId = null;
    }

    async loadState(chatId: string) {
        this.chatId = chatId;
        const { fetchChatCanvasState } = await import("@/lib/supabase/db");
        try {
            const state = await fetchChatCanvasState(chatId);
            if (state) {
                // If we have saved state, load it
                this.content = state.content || "";
                this.language = state.language || "markdown";
                this.isOpen = state.isOpen || false;
            } else {
                // No state found? Reset or Keep?
                // If it's a new chat or empty, we keep default BUT if we switch chats we must reset first.
                // It is better to rely on caller to reset() before loadState() if needed.
                this.isOpen = false;
                this.content = "";
            }
        } catch (e) {
            console.error("Failed to load canvas state", e);
        }
    }

    triggerAutoSave() {
        if (!this.chatId) return;
        
        if (this.saveTimer) clearTimeout(this.saveTimer);
        
        this.saveTimer = setTimeout(async () => {
             const { updateChatCanvasState } = await import("@/lib/supabase/db");
             if (this.chatId) {
                await updateChatCanvasState(this.chatId, {
                    content: this.content,
                    language: this.language,
                    isOpen: this.isOpen
                });
             }
        }, 1000); // 1s debounce
    }
}

export const canvasStore = new CanvasStore();
