"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getNextQuestionAPI, reviseAnswerAPI } from "@/lib/api";
import { useInterviewStore } from "@/lib/store/interviewStore";
import { useParams, useRouter } from "next/navigation";
import { ResponseInputProps } from "@/types";
import Image from "next/image";
import { Textarea } from "./ui/textarea";
import { Pause, Loader } from "lucide-react";

const maxAnswerLength = 1499;
const minAnswerLength = 140;

export function ResponseInput({
  onSubmitText,
  onStartRecording,
  onStopRecording,
  isTranscribing,
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
    if (textResponse?.trim()) {
      onSubmitText(textResponse);
      setTextResponse("");
    }
  }, [textResponse, onSubmitText, setTextResponse]);

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
        if (textResponse?.trim() && textResponse?.length > minAnswerLength) {
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
    <div className="w-full flex flex-col p-2 pb-5 sm:pb-0">
      {!interviewComplete && isLatestFeedback ? (
        <div className="w-full flex sm:flex-row flex-col items-center justify-center gap-2 sm:p-5 md:p-0 sm:gap-5">
          <p className="text-black text-sm sm:text-base leading-relaxed font-medium wrap-break-word">
            Do you want to revise the answer?
          </p>
          <div className="flex flex-row gap-2 sm:gap-5">
            <Button
              onClick={handleReviseQuestion}
              disabled={isAISpeaking || loading}
              className="bg-[#3B64F6] cursor-pointer h-fit py-1 px-2 text-sm sm:text-base"
            >
              Yes
            </Button>
            <Button
              onClick={() => {
                if (maxQuestions === questionCount) {
                  router.replace(`/${sessionId}/assessment`);
                } else {
                  getNextQuestion();
                }
              }}
              disabled={isAISpeaking || loading}
              className={`${
                maxQuestions === questionCount ? "bg-green-500" : "bg-[#C51E1E]"
              } cursor-pointer h-fit py-1 px-2 text-sm sm:text-base`}
            >
              {maxQuestions === questionCount ? "Get Assessment!" : "No"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 flex items-center h-full gap-2 rounded-2xl overflow-hidden shadow-md">
            <Textarea
              placeholder={
                isAISpeaking
                  ? "AI is speaking..."
                  : isRecording
                  ? "Recording..."
                  : isTranscribing
                  ? "Transcribing..."
                  : "Type your response here..."
              }
              ref={inputRef}
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              minLength={minAnswerLength}
              maxLength={maxAnswerLength}
              className="ml-2 text-sm sm:text-base flex-1 sm:font-medium border-none outline-none shadow-none placeholder:text-[#919ECD] px-2 py-3 resize-none h-[40px]"
              disabled={isRecording || isAISpeaking || isTranscribing}
            />
            {textResponse?.trim() && (
              <p className="text-xs hidden md:block">
                ({maxAnswerLength - textResponse?.length})
              </p>
            )}
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
              disabled={
                isAISpeaking ||
                (!isRecording &&
                  (!textResponse?.trim() ||
                    textResponse?.length < minAnswerLength))
              }
              className="w-12 h-12 rounded-none cursor-pointer bg-[#3B64F6]"
            >
              {isRecording ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : isTranscribing ? (
                <Loader className="w-4 h-4 mr-2" />
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
          {isAISpeaking ||
            (textResponse?.length < minAnswerLength && (
              <p className="text-xs text-muted-foreground w-full text-center mt-1">
                Answer/Response should be atleast 140 character long
              </p>
            ))}
        </>
      )}
      {isAISpeaking && (
        <p className="text-xs text-muted-foreground w-full text-center mt-1">
          You can skip the audio to proceed!
        </p>
      )}
    </div>
  );
}
