"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send } from "lucide-react";
import { getNextQuestionAPI, reviseAnswerAPI } from "@/lib/api";

interface ResponseInputProps {
  onSubmitText: (text: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  isAISpeaking: boolean;
  setConversation: React.Dispatch<
    React.SetStateAction<
      Array<{ role: "ai" | "user"; content: string; isFeedback?: boolean }>
    >
  >;
  speakTextWithTTS: (text: string) => Promise<void>;
  setCurrentQuestion: React.Dispatch<React.SetStateAction<string>>;
  setQuestionCount: React.Dispatch<React.SetStateAction<number>>;
  isLatestFeedback?: boolean;
  interviewComplete?: boolean;
  maxQuestions?: number;
  questionCount?: number;
  setShowFinalAssessment: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ResponseInput({
  onSubmitText,
  onStartRecording,
  onStopRecording,
  isRecording,
  isAISpeaking,
  setConversation,
  speakTextWithTTS,
  setCurrentQuestion,
  setQuestionCount,
  isLatestFeedback,
  interviewComplete,
  maxQuestions,
  questionCount,
  setShowFinalAssessment,
}: ResponseInputProps) {
  const [textResponse, setTextResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    console.error("Session ID not found.");
    return;
  }
  const handleReviseQuestion = async () => {
    setLoading(true);
    try {
      const data = await reviseAnswerAPI(sessionId);

      setConversation((prev) => [
        ...prev,
        { role: "ai", content: data.question, isFeedback: false },
      ]);

      speakTextWithTTS(data.question);
    } catch (error) {
      console.error("Error reviseing answer:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNextQuestion = async () => {
    setLoading(true);
    if (questionCount === maxQuestions) {
      setShowFinalAssessment(true);
      return;
    }

    try {
      const data = await getNextQuestionAPI(sessionId);
      setQuestionCount((prev) => prev + 1);

      setCurrentQuestion(data?.question);
      setConversation((prev) => [
        ...prev,
        { role: "ai", content: data?.question, isFeedback: false },
      ]);
      speakTextWithTTS(data?.question);
    } catch (error) {
      console.error("Error getting next question:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (textResponse.trim()) {
      onSubmitText(textResponse);
      setTextResponse("");
    }
  };

  return (
    <div className="space-y-3 ">
      <div className="flex items-center justify-center space-x-2 mb-2">
        <div className="h-px bg-gray-200 flex-grow"></div>
        <span className="text-sm text-gray-500 px-2">Respond via</span>
        <div className="h-px bg-gray-200 flex-grow"></div>
      </div>

      <div className="w-full flex flex-col md:flex-row gap-3">
        {!interviewComplete && isLatestFeedback ? (
          <div className="w-full flex items-center justify-center gap-5 m-4">
            <p className="text-yellow-700 text-sm leading-relaxed">
              Do you want to revise the answer?
            </p>
            <Button
              onClick={handleReviseQuestion}
              disabled={isAISpeaking || loading}
              className="bg-green-500 hover:bg-green-600 cursor-pointer"
            >
              yes
            </Button>
            <Button
              onClick={getNextQuestion}
              disabled={isAISpeaking || loading}
              className={`${
                maxQuestions === questionCount
                  ? "bg-blue-400 hover:bg-blue-500"
                  : "bg-red-500 hover:bg-red-600 "
              } cursor-pointer`}
            >
              {maxQuestions === questionCount ? "Get Assessment!" : "No"}
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex gap-4 items-end">
            <Textarea
              placeholder={
                isAISpeaking
                  ? "AI is speaking..."
                  : "Type your response here..."
              }
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              className="rounded-xl resize-none p-2 px-4 shadow-md"
              disabled={isRecording || isAISpeaking}
            />
            {textResponse ? (
              <div className="">
                <Button
                  onClick={handleSubmit}
                  disabled={!textResponse.trim() || isAISpeaking}
                  className=" w-10 h-10 rounded-full cursor-pointer bg-blue-600 hover:bg-blue-700"
                >
                  <Send />
                </Button>
              </div>
            ) : (
              <Button
                onClick={isRecording ? onStopRecording : onStartRecording}
                disabled={isAISpeaking}
                className={`w-10 h-10 rounded-full cursor-pointer ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600 "
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff />
                  </>
                ) : (
                  <>
                    <Mic />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
