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
  saveFormData: (data: InterviewSetupData) => void;
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

export interface OverallFeedback {
  overall_score: number;
  summary: string;
  questions_analysis: Array<any>;
  coaching_scores: {
    clarity_of_motivation: number;
    specificity_of_learning: number;
    career_goal_alignment: number;
  };
  recommendations: string[];
  closure_message: string;
  level: string;
}

export interface InterviewStoreState {
  conversation: ConversationEntry[];
  overallFeedback: OverallFeedback;
  interviewComplete: boolean;
  interviewStarted: boolean;
  questionCount: number;
  maxQuestions: number;
  interviewStartTime: Date | null;
  isAISpeaking: boolean;
  audioInstance: HTMLAudioElement | null;
  browserUtterance: SpeechSynthesisUtterance | null;

  addMessage: (message: ConversationEntry) => void;
  resetConversation: () => void;

  setOverallFeedback: (feedback: OverallFeedback) => void;
  setInterviewComplete: (complete: boolean) => void;
  setInterviewStarted: (started: boolean) => void;
  incrementQuestionCount: () => void;
  resetQuestionCount: () => void;
  setInterviewStartTime: (time: Date | null) => void;
  resetStore: () => void;
  setIsAISpeaking: (value: boolean) => void;
  setAudioInstance: (audio: HTMLAudioElement | null) => void;
  setBrowserUtterance: (utterance: SpeechSynthesisUtterance | null) => void;
  stopSpeaking: () => void;
}

export interface ResponseInputProps {
  onSubmitText: (text: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  isAISpeaking: boolean;
  speakTextWithTTS: (text: string) => Promise<void>;
  isLatestFeedback?: boolean;
}
