"use client";

import { useEffect, useRef, useState } from "react";
import { FeedbackDisplay } from "@/components/feedback-display";
import { VideoCall } from "@/components/video-call";
import { AudioRecorder } from "@/components/audio-recorder";
import { ResponseInput } from "@/components/response-input";
import { useParams } from "next/navigation";
import { submitAnswerAPI } from "@/lib/api";
import { useFormStore } from "@/lib/store/formStore";
import { useInterviewStore } from "@/lib/store/interviewStore";
import { speakTextWithTTS } from "@/lib/audioApi";
import { ConfirmDialog } from "./ConfirmDialog";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function AIInterviewSystem() {
  const { formData: interviewSetup } = useFormStore();
  const {
    conversation,
    addMessage: setConversation,
    overallFeedback,
    interviewComplete,
    isAISpeaking,
    questionCount,
    maxQuestions,
    stopSpeaking,
    audioInstance,
  } = useInterviewStore();

  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [textResponse, setTextResponse] = useState("");

  const { startRecording, stopRecording } = AudioRecorder({
    onTranscription: (text) => {
      setTextResponse(text);
    },
    isRecording,
    onRecordingStart: () => setIsRecording(true),
    onRecordingStop: () => setIsRecording(false),
  });

  const handleUserResponse = async (userResponse: string) => {
    if (!interviewSetup) return;

    if (!sessionId) {
      console.error("Session ID not found.");
      return;
    }

    const newConversation = { role: "user" as const, content: userResponse };
    setConversation(newConversation);

    try {
      const data = await submitAnswerAPI(sessionId, userResponse);

      setConversation({ role: "ai", content: data.feedback, isFeedback: true });
      await speakTextWithTTS(data.feedback);
    } catch (error) {
      console.error("Error getting AI response:", error);
    }
  };

  useEffect(() => {
    scrollRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, overallFeedback]);

  // TODO: default browser popup on refresh
  useEffect(() => {
    history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      setOpenDialog(true);
      history.pushState(null, "", window.location.href);
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();

      setOpenDialog(true);
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div className="w-full h-screen bg-[#F5F8FF] py-4 pt-24">
      <div className="w-7xl h-full mx-auto grid grid-cols-[2fr_5fr] gap-4">
        <div className="flex flex-col gap-4 w-full">
          <VideoCall />
        </div>

        <div className="w-full h-[85vh] rounded-3xl bg-[#FFFFFF] border border-[#E2E8F0] flex flex-col">
          <div className="py-4 px-5 m-2 rounded-tl-2xl rounded-tr-2xl bg-[#F7F9FC] flex flex-row items-center gap-2">
            <Image
              src="/assets/svg/question.svg"
              alt="question_logo"
              width={20}
              height={20}
            />
            <p className="text-xl font-medium">Question</p>

            <div className="flex-1 flex items-center justify-between gap-2 px-1.5">
              {[...Array(maxQuestions)].map((_, index) => (
                <div
                  key={index}
                  className={`w-full h-2  rounded-sm ${
                    index < questionCount ? "bg-[#47B881]" : "bg-[#CDD8E8]"
                  }`}
                />
              ))}
            </div>
            <p className="text-xl font-medium">
              {questionCount}/{maxQuestions}
            </p>
          </div>

          <div className="w-full h-[1px] bg-[#E2E8F0] " />

          <div className="flex-1 flex flex-col px-6 overflow-y-auto">
            <div className="flex-1 flex flex-col overflow-y-auto space-y-4">
              {conversation.map((message, index) => {
                const isLastMessage = index === conversation.length - 1;

                if (message?.isFeedback) {
                  return (
                    <FeedbackDisplay
                      key={index}
                      feedback={message.content}
                      isLastMessage={isLastMessage}
                    />
                  );
                }

                return (
                  <div
                    key={index}
                    className={`p-2 w-fit max-w-[90%] flex flex-col ${
                      message.role === "ai" ? "self-start" : "self-end"
                    }`}
                  >
                    <div className="flex flex-col gap-1 ">
                      {message.role === "ai" ? (
                        <div className="flex items-center gap-2">
                          <Image
                            src="/assets/svg/interviewAi.svg"
                            alt="AI"
                            width={24}
                            height={24}
                          />
                          <p className="text-base font-semibold">
                            AI Interviewer
                          </p>

                          {isLastMessage &&
                            isAISpeaking &&
                            (audioInstance ? (
                              <Button
                                variant="ghost"
                                className="flex items-center gap-2 px-2 py-1 h-fit text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition cursor-pointer"
                                onClick={stopSpeaking}
                              >
                                <div className="relative w-4 h-4 flex items-center justify-center">
                                  <Image
                                    src="/assets/svg/pause.svg"
                                    alt="Pause AI Audio"
                                    width={16}
                                    height={16}
                                    className="z-10"
                                  />
                                  <div className="absolute w-6 h-6 bg-[#3B64F6] opacity-50 rounded-full animate-ping" />
                                </div>
                                <span>Skip Audio</span>
                              </Button>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                Generating audio...
                              </p>
                            ))}
                        </div>
                      ) : (
                        <div className="flex flex-row-reverse items-center gap-2">
                          <Image
                            src="/assets/images/johnDoe.png"
                            alt="AI"
                            width={24}
                            height={24}
                          />
                          <p className="text-base font-semibold">You</p>
                        </div>
                      )}

                      <p
                        className={`p-6  border  rounded-2xl text-sm font-medium ${
                          message.role === "ai"
                            ? "border-[#8692A633]"
                            : "border-[#F4F3FF] bg-[#E2E8FF]"
                        }`}
                      >
                        {message.content}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          </div>

          <div className="px-5 pb-2">
            {!interviewComplete && (
              <ResponseInput
                onSubmitText={handleUserResponse}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                isRecording={isRecording}
                isAISpeaking={isAISpeaking}
                speakTextWithTTS={speakTextWithTTS}
                isLatestFeedback={
                  conversation.length > 0
                    ? conversation[conversation.length - 1]?.isFeedback ?? false
                    : false
                }
                textResponse={textResponse}
                setTextResponse={setTextResponse}
              />
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog openDialogue={openDialog} setOpenDialog={setOpenDialog} />
    </div>
  );
}
