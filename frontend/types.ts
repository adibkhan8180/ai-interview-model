export interface InterviewSetupData {
  companyName: string;
  jobRole: string;
  interviewCategory: string;
  domain: string;
  jobDescription: string;
  inputType: "skills-based" | "job-description"; // Added for radio input selection
  skills: string[]; // Added for skills array
}

export interface FormState {
  formData: InterviewSetupData;
  setFormData: (data: Partial<InterviewSetupData>) => void;
  resetForm: () => void;
}

export interface InterviewStartResponse {
  success: boolean;
  sessionId?: string;
  question?: string;
  isFeedback?: boolean;
}

export type MessageRole = "ai" | "user";

export interface ConversationEntry {
  role: MessageRole;
  content: string;
  isFeedback?: boolean;
}

export interface InterviewStoreState {
  conversation: ConversationEntry[];
  overallFeedback: any;
  interviewComplete: boolean;
  questionCount: number;
  maxQuestions: number;
  interviewStartTime: Date | null;
  isAISpeaking: boolean;

  addMessage: (message: ConversationEntry) => void;
  resetConversation: () => void;

  setOverallFeedback: (feedback: any) => void;
  setInterviewComplete: (complete: boolean) => void;
  incrementQuestionCount: () => void;
  resetQuestionCount: () => void;
  setInterviewStartTime: (time: Date | null) => void;
  resetStore: () => void;
  setIsAISpeaking: (value: boolean) => void;
}
