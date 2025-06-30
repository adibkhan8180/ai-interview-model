import { create } from "zustand";
import { persist } from "zustand/middleware";
import { InterviewStoreState } from "@/types";

const initialState = {
  conversation: [],
  overallFeedback: {},
  interviewComplete: false,
  questionCount: 0,
  maxQuestions: 3,
  interviewStartTime: null,
  isAISpeaking: false,
};

export const useInterviewStore = create<InterviewStoreState>()(
  persist(
    (set) => ({
      ...initialState,

      addMessage: (message) =>
        set((state) => ({
          conversation: [...state.conversation, message],
        })),

      resetConversation: () =>
        set(() => ({
          conversation: [],
        })),

      setOverallFeedback: (feedback) => set({ overallFeedback: feedback }),

      setInterviewComplete: (complete) => set({ interviewComplete: complete }),

      incrementQuestionCount: () =>
        set((state) => ({
          questionCount: state.questionCount + 1,
        })),

      resetQuestionCount: () =>
        set(() => ({
          questionCount: 0,
        })),

      setInterviewStartTime: (time) => set({ interviewStartTime: time }),

      setIsAISpeaking: (value: boolean) => set({ isAISpeaking: value }),

      resetStore: () => set({ ...initialState }),
    }),
    {
      name: "interview-storage",
    }
  )
);
