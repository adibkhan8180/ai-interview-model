"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send } from "lucide-react";
import { getNextQuestionAPI, reviseAnswerAPI } from "@/lib/api";
import { useInterviewStore } from "@/lib/store/interviewStore";
import { useParams, useRouter } from "next/navigation";
import { ResponseInputProps } from "@/types";

export function ResponseInput({
  onSubmitText,
  onStartRecording,
  onStopRecording,
  isRecording,
  isAISpeaking,
  speakTextWithTTS,
  isLatestFeedback,
}: ResponseInputProps) {
  const router = useRouter();
  const [textResponse, setTextResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const {
    addMessage: setConversation,
    interviewComplete,
    questionCount,
    incrementQuestionCount,
    maxQuestions,
  } = useInterviewStore();

  const params = useParams();
  const sessionId = params?.sessionId as string;
  if (!sessionId) {
    return;
  }

  const handleReviseQuestion = async () => {
    setLoading(true);
    try {
      const data = await reviseAnswerAPI(sessionId);

      setConversation({
        role: "ai",
        content: data.question,
        isFeedback: false,
      });

      speakTextWithTTS(data.question);
    } catch (error) {
      console.error("Error reviseing answer:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNextQuestion = async () => {
    try {
      setLoading(true);
      const data = await getNextQuestionAPI(sessionId);
      incrementQuestionCount();

      setConversation({
        role: "ai",
        content: data?.question,
        isFeedback: false,
      });
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (textResponse !== "" && event.key === "Enter") {
        handleSubmit();
      }

      if (textResponse === "" && event.key === "Enter") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [textResponse, handleSubmit]);

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
              disabled={isAISpeaking ? true : loading}
              className="bg-green-500 hover:bg-green-600 cursor-pointer"
            >
              yes
            </Button>
            <Button
              onClick={() => {
                maxQuestions === questionCount
                  ? router.push(`/${sessionId}/assessment`)
                  : getNextQuestion();
              }}
              disabled={isAISpeaking ? true : loading}
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
              ref={inputRef}
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              className="rounded-xl resize-none p-2 px-4 shadow-md"
              disabled={isRecording || isAISpeaking}
            />
            {textResponse.trim() ? (
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
