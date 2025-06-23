import { create } from "zustand";
import { InterviewStoreState } from "@/types";

export const useInterviewStore = create<InterviewStoreState>((set) => ({
  conversation: [],
  overallFeedback: {},
  interviewComplete: false,
  questionCount: 0,
  maxQuestions: 1,
  interviewStartTime: null,

  addMessage: (message) =>
    set((state) => ({
      conversation: [...state.conversation, message],
    })),

  resetConversation: () =>
    set({
      conversation: [],
    }),

  setOverallFeedback: (feedback) => set({ overallFeedback: feedback }),

  setInterviewComplete: (complete) => set({ interviewComplete: complete }),

  incrementQuestionCount: () =>
    set((state) => ({ questionCount: state.questionCount + 1 })),

  resetQuestionCount: () => set({ questionCount: 0 }),

  setInterviewStartTime: (time) => set({ interviewStartTime: time }),
}));
