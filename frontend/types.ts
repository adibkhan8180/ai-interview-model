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
