import { makeAutoObservable } from "mobx";

class CanvasStore {
    isOpen = false;
    content = "";
    language = "markdown";
    isVisible = false; // For animation purposes maybe?

    constructor() {
        makeAutoObservable(this);
    }

    setIsOpen(isOpen: boolean) {
        this.isOpen = isOpen;
    }

    setContent(content: string) {
        this.content = content;
    }

    setLanguage(language: string) {
        this.language = language;
    }

    openWithContent(content: string, language: string = "markdown") {
        this.content = content;
        this.language = language;
        this.isOpen = true;
    }
}

export const canvasStore = new CanvasStore();
