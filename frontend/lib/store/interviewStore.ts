import { create } from "zustand";
import { ConversationEntry } from "@/types";

interface ConversationState {
  conversation: ConversationEntry[];
  addMessage: (message: ConversationEntry) => void;
  resetConversation: () => void;
}

export const useInterviewStore = create<ConversationState>((set) => ({
  conversation: [],

  addMessage: (message) =>
    set((state) => ({
      conversation: [...state.conversation, message],
    })),

  resetConversation: () =>
    set({
      conversation: [],
    }),
}));
