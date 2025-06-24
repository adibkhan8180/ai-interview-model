"use client";

import { useRef, useState } from "react";
import {
  generateSpeech,
  playAudioFromArrayBuffer,
} from "@/services/text-to-speech";
import { InterviewSetupForm } from "@/components/interview-setup-form";
import { useParams, useRouter } from "next/navigation";
import { startInterviewAPI } from "@/lib/api";
import { InterviewSetupData } from "@/types";
import { useFormStore } from "@/lib/store/formStore";
import { useInterviewStore } from "@/lib/store/interviewStore";

export default function AIInterviewSetup() {
  const router = useRouter();
  const {
    formData: interviewSetup,
    setFormData: setInterviewSetup,
    resetForm,
  } = useFormStore();
  const {
    addMessage: setConversation,
    incrementQuestionCount,
    setInterviewStartTime,
    resetStore: resetInterviewStore,
  } = useInterviewStore();
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const sessionId = params?.sessionId as string;
  // const [conversation, setConversation] = useState<
  //   Array<{ role: "ai" | "user"; content: string; isFeedback?: boolean }>
  // >([
  //   { role: "ai", content: "Hi! How can I help you today?", isFeedback: true },
  // ]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentFeedback, setCurrentFeedback] = useState("");
  // const [overallFeedback, setOverallFeedback] = useState({});
  // const [interviewComplete, setInterviewComplete] = useState(false);
  // const [questionCount, setQuestionCount] = useState(0);
  // const [maxQuestions] = useState(1); // Limit interview to 7 questions
  // const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(
  //   null
  // );
  const [transcribedText, setTranscribedText] = useState("");
  const [showFinalAssessment, setShowFinalAssessment] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSetupSubmit = (data: InterviewSetupData) => {
    setInterviewSetup(data);
    startInterview(data);
  };

  const startInterview = async (setupData: InterviewSetupData) => {
    if (loading) return;

    setLoading(true);
    resetInterviewStore();

    setInterviewStartTime(new Date());

    const { companyName, jobRole, interviewCategory } = setupData;

    if (!companyName || !jobRole || !interviewCategory) {
      alert("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const data = await startInterviewAPI(setupData);

      if (!data.success || !data.sessionId || !data.question) {
        throw new Error("Failed to start interview. Please try again.");
      }

      incrementQuestionCount();
      setCurrentQuestion(data.question);
      setConversation({
        role: "ai",
        content: data.question,
        isFeedback: data.isFeedback ?? false,
      });
      setInterviewStarted(true);

      router.push(`/${data.sessionId}`);

      speakTextWithTTS(data.question);
    } catch (error) {
      console.error("Error starting interview:", error);
    } finally {
      setLoading(false);
    }
  };

  const speakTextWithTTS = async (text: string) => {
    try {
      setIsAISpeaking(true);
      const audioData = await generateSpeech({ text });
      await playAudioFromArrayBuffer(audioData);
      setIsAISpeaking(false);
    } catch (error) {
      console.error("Error with TTS:", error);
      // Fallback to browser TTS
      speakTextWithBrowser(text);
    }
  };

  const speakTextWithBrowser = (text: string) => {
    if ("speechSynthesis" in window) {
      setIsAISpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsAISpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-10">
        <InterviewSetupForm onSubmit={handleSetupSubmit} loading={loading} />
      </div>
    </div>
  );
}
