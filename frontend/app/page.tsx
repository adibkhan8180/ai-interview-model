"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { InterviewSetupForm } from "@/components/interview-setup-form";
import { useFormStore } from "@/lib/store/formStore";
import { useInterviewStore } from "@/lib/store/interviewStore";
import { startInterviewAPI } from "@/lib/api";
import { speakTextWithTTS } from "@/lib/audioApi";
import { InterviewSetupData } from "@/types";

export default function AIInterviewSetup() {
  const router = useRouter();
  const { setFormData } = useFormStore();
  const {
    addMessage: setConversation,
    incrementQuestionCount,
    setInterviewStartTime,
    resetStore: resetInterviewStore,
  } = useInterviewStore();
  const [loading, setLoading] = useState(false);

  const handleSetupSubmit = (data: InterviewSetupData) => {
    setFormData(data);
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
      setConversation({
        role: "ai",
        content: data.question,
        isFeedback: data.isFeedback ?? false,
      });

      router.push(`/${data.sessionId}`);
      speakTextWithTTS(data.question);
    } catch (error) {
      console.error("Error starting interview:", error);
    } finally {
      setLoading(false);
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
