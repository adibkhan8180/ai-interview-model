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
  audioInstance: null,
  browserUtterance: null,
};

export const useInterviewStore = create<InterviewStoreState>()(
  persist(
    (set, get) => ({
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

      setAudioInstance: (audio) => set({ audioInstance: audio }),
      setBrowserUtterance: (utterance) => set({ browserUtterance: utterance }),

      stopSpeaking: () => {
        const { audioInstance, browserUtterance } = get();

        if (audioInstance) {
          audioInstance.pause();
          audioInstance.currentTime = 0;
          set({ audioInstance: null });
        }

        if (browserUtterance) {
          speechSynthesis.cancel();
          set({ browserUtterance: null });
        }

        set({ isAISpeaking: false });
      },

      resetStore: () => set({ ...initialState }),
    }),
    {
      name: "interview-storage",
    }
  )
);
