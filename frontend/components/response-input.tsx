"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send } from "lucide-react";
import { getNextQuestionAPI, reviseAnswerAPI } from "@/lib/api";
import { useInterviewStore } from "@/lib/store/interviewStore";
import { useParams, useRouter } from "next/navigation";
import { ResponseInputProps } from "@/types";
import { Input } from "./ui/input";
import Image from "next/image";

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
  const inputRef = useRef<HTMLInputElement>(null);
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
    <div className="w-full flex flex-col ">
      {/* {!interviewComplete && isLatestFeedback && (
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
      )} */}
      <div className="flex-1 flex items-center h-full gap-4  rounded-2xl overflow-hidden shadow-2xl">
        <Input
          placeholder={
            isAISpeaking ? "AI is speaking..." : "Type your response here..."
          }
          ref={inputRef}
          value={textResponse}
          onChange={(e) => setTextResponse(e.target.value)}
          className="ml-2 text-base flex-1 font-medium border-none outline-none shadow-none placeholder:text-[#919ECD] px-2 py-3 "
          disabled={isRecording || isAISpeaking}
        />
        <Button
          onClick={isRecording ? onStopRecording : onStartRecording}
          variant="outline"
          disabled={isAISpeaking}
          className={`rounded-full cursor-pointer h-fit py-1 px-2 ${
            isRecording ? "" : ""
          }`}
        >
          <Image
            src="/assets/svg/audioPulse.svg"
            alt="audio_pulse"
            height={16}
            width={16}
          />
          <p className="text-sm font-medium text-[#3B64F6]">Voice</p>
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!textResponse.trim() || isAISpeaking}
          className=" w-12 h-12 rounded-none cursor-pointer bg-[#3B64F6]"
        >
          <Image src="/assets/svg/send.svg" alt="send" height={20} width={20} />
        </Button>
      </div>
    </div>
  );
}
