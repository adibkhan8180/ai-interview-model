import { create } from "zustand";
import { persist } from "zustand/middleware";
import { InterviewStoreState } from "@/types";

const initialFinalFeedback = {
  overall_score: 80,
  summary:
    "Candidate demonstrated strong technical skills and leadership abilities. They have hands-on experience with ReactJS and Next.js and have successfully optimized a React application for better performance.",
  questions_analysis: [
    {
      question:
        "Could you please introduce yourself and share a bit about your experience in the field of frontend development?",
      response:
        "I'm Sandesh Lawhale recently graduated from SGB Amravati University with the specialization of Computer Science with overall CGPA of 9. While studying I've gained some technical skills experiences by myself by doing some projects, one project I'd like to add is a hotwheels ecommerce website where I've built the e-commerce store where user can see the hotwheels models, search filter and much more they can check particular product and then order it by some payment procedure with actual payment gateway integration and the proper authentication, I've used Reactjs nodejs and mongodb as backend and express as connection between them and setting backend it is a full-fledged website for a fullstack development perspective.",
      feedback:
        "Candidate provided a detailed response showcasing their technical skills and project experience.",
      strengths: ["Technical skills", "Project experience"],
      improvements: ["Could provide more specific examples"],
      score: 8,
      response_depth: "Advanced",
    },
    {
      question:
        "Can you tell me about a challenging feature that you implemented using ReactJS? How did you approach the problem and what was the outcome?",
      response:
        "In my Hotwheels e-commerce project, I used Next.js mainly for server-side rendering, routing, and API routes, which made the app faster and more SEO-friendly compared to plain React.js. The built-in routing and server-side data fetching were big advantages, reducing the need for extra configurations and improving overall performance.",
      feedback:
        "Candidate demonstrated a good understanding of ReactJS and Next.js and was able to successfully implement challenging features.",
      strengths: [
        "Understanding of ReactJS and Next.js",
        "Problem-solving skills",
      ],
      improvements: ["Could provide more specific examples"],
      score: 8,
      response_depth: "Advanced",
    },
    {
      question:
        "Could you tell me about a time when you had to optimize a React application for better performance? What steps did you take and what was the result?",
      response:
        "One challenge I faced was handling API response delays when fetching large amounts of product data in my project. The server would slow down, affecting the frontend. To solve it, I optimized the MongoDB queries, added pagination, and used async/await properly to avoid blocking operations. This improved response time and made the API much more efficient.",
      feedback:
        "Candidate demonstrated a good understanding of performance optimization in React applications.",
      strengths: [
        "Understanding of performance optimization",
        "Problem-solving skills",
      ],
      improvements: ["Could provide more specific examples"],
      score: 8,
      response_depth: "Advanced",
    },
  ],
  coaching_scores: {
    clarity_of_motivation: 4,
    specificity_of_learning: 4,
    career_goal_alignment: 4,
  },
  recommendations: [
    "Continue to work on complex projects to further enhance technical skills",
    "Practice explaining technical concepts in a more simplified manner",
  ],
  closure_message:
    "Thank you for your time, Sandesh. Your technical skills and experience are impressive. We will be in touch with you soon.",
  level: "High-Caliber",
};

const initialState = {
  conversation: [],
  overallFeedback: initialFinalFeedback,
  interviewComplete: false,
  questionCount: 0,
  maxQuestions: 3,
  interviewStartTime: null,
  isAISpeaking: false,
  audioInstance: null,
  browserUtterance: null,
};

export const useInterviewStore = create<InterviewStoreState>(
  // persist(
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
  })
  // {
  //   name: "interview-storage",
  // }
  // )
);
