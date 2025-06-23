export interface InterviewSetupData {
  companyName: string;
  jobRole: string;
  interviewCategory: "general" | "hr" | "domain-specific";
  domain?: string;
  jobDescription: string;
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

  addMessage: (message: ConversationEntry) => void;
  resetConversation: () => void;

  setOverallFeedback: (feedback: any) => void;
  setInterviewComplete: (complete: boolean) => void;
  incrementQuestionCount: () => void;
  resetQuestionCount: () => void;
  setInterviewStartTime: (time: Date | null) => void;
}
