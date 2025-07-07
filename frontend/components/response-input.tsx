"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getNextQuestionAPI, reviseAnswerAPI } from "@/lib/api";
import { useInterviewStore } from "@/lib/store/interviewStore";
import { useParams, useRouter } from "next/navigation";
import { ResponseInputProps } from "@/types";
import Image from "next/image";
import { Textarea } from "./ui/textarea";
import { Pause } from "lucide-react";

export function ResponseInput({
  onSubmitText,
  onStartRecording,
  onStopRecording,
  isRecording,
  isAISpeaking,
  speakTextWithTTS,
  isLatestFeedback,
  textResponse,
  setTextResponse,
}: ResponseInputProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const {
    addMessage: setConversation,
    interviewComplete,
    questionCount,
    incrementQuestionCount,
    maxQuestions,
  } = useInterviewStore();

  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const params = useParams();
  const sessionId = params?.sessionId as string;

  const handleSubmit = useCallback(() => {
    if (textResponse.trim()) {
      onSubmitText(textResponse);
      setTextResponse("");
    }
  }, [textResponse, onSubmitText]);

  const handleReviseQuestion = useCallback(async () => {
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
      console.error("Error revising answer:", error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, setConversation, speakTextWithTTS]);

  const getNextQuestion = useCallback(async () => {
    setLoading(true);
    try {
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
  }, [sessionId, incrementQuestionCount, setConversation, speakTextWithTTS]);

  const handleStartRecording = () => {
    if (isRecording) {
      return;
    }
    setCountdown(120);
    onStartRecording();

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev && prev > 1) {
          return prev - 1;
        } else {
          handleStopRecording();
          return 0;
        }
      });
    }, 1000);
  };

  const handleStopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(null);
    onStopRecording();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (textResponse.trim()) {
          handleSubmit();
        } else {
          event.preventDefault();
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [textResponse, handleSubmit]);

  if (!sessionId) return null;

  return (
    <div className="w-full flex flex-col">
      {!interviewComplete && isLatestFeedback ? (
        <div className="w-full flex items-center justify-center gap-5 m-4">
          <p className="text-black text-base leading-relaxed font-medium">
            Do you want to revise the answer?
          </p>
          <Button
            onClick={handleReviseQuestion}
            disabled={isAISpeaking || loading}
            className="bg-[#3B64F6] cursor-pointer"
          >
            Yes
          </Button>
          <Button
            onClick={() => {
              if (maxQuestions === questionCount) {
                router.push(`/${sessionId}/assessment`);
              } else {
                getNextQuestion();
              }
            }}
            disabled={isAISpeaking || loading}
            className={`${
              maxQuestions === questionCount ? "bg-green-500" : "bg-[#C51E1E]"
            } cursor-pointer`}
          >
            {maxQuestions === questionCount ? "Get Assessment!" : "No"}
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex items-center h-full gap-4 rounded-2xl overflow-hidden shadow-md">
          <Textarea
            placeholder={
              isAISpeaking ? "AI is speaking..." : "Type your response here..."
            }
            ref={inputRef}
            value={textResponse}
            onChange={(e) => setTextResponse(e.target.value)}
            className="ml-2 text-base flex-1 font-medium border-none outline-none shadow-none placeholder:text-[#919ECD] px-2 py-3 resize-none h-[40px]"
            disabled={isRecording || isAISpeaking}
          />
          <Button
            onClick={handleStartRecording}
            variant="outline"
            disabled={isAISpeaking}
            className="rounded-full cursor-pointer h-fit py-1 px-2"
          >
            <Image
              src={
                isRecording
                  ? "/assets/gif/audioWave.gif"
                  : "/assets/svg/audioPulse.svg"
              }
              alt="audio_pulse"
              height={16}
              width={16}
            />
            <p className="text-sm font-medium text-[#3B64F6]">
              {isRecording
                ? `${Math.floor((countdown || 0) / 60)
                    .toString()
                    .padStart(2, "0")}:${((countdown || 0) % 60)
                    .toString()
                    .padStart(2, "0")}`
                : "Voice"}
            </p>
          </Button>
          <Button
            onClick={isRecording ? handleStopRecording : handleSubmit}
            disabled={isAISpeaking || (!isRecording && !textResponse.trim())}
            className="w-12 h-12 rounded-none cursor-pointer bg-[#3B64F6]"
          >
            {isRecording ? (
              <Pause className="w-4 h-4 mr-2" />
            ) : (
              <Image
                src="/assets/svg/send.svg"
                alt="send"
                height={20}
                width={20}
              />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
