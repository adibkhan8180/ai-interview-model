"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackDisplay } from "@/components/feedback-display";
import { InterviewProgress } from "@/components/interview-progress";
import { VideoCall } from "@/components/video-call";
import { AudioRecorder } from "@/components/audio-recorder";
import {
  generateSpeech,
  playAudioFromArrayBuffer,
} from "@/services/text-to-speech";
import { ResponseInput } from "@/components/response-input";
import { useParams, usePathname, useRouter } from "next/navigation";
import { submitAnswerAPI, submitFinalInterviewAPI } from "@/lib/api";
import { useFormStore } from "@/lib/store/formStore";
import { useInterviewStore } from "@/lib/store/interviewStore";

export default function AIInterviewSystem() {
  const router = useRouter();
  const pathname = usePathname();
  const { formData: interviewSetup, resetForm: resetInterviewSetup } =
    useFormStore();
  const {
    conversation,
    addMessage: setConversation,
    overallFeedback,
    setOverallFeedback,
    interviewComplete,
    setInterviewComplete,
    interviewStartTime,
    resetStore: resetInterviewStore,
  } = useInterviewStore();

  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentFeedback, setCurrentFeedback] = useState("");
  const [transcribedText, setTranscribedText] = useState("");
  const [showFinalAssessment, setShowFinalAssessment] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize audio recorder
  const { startRecording, stopRecording } = AudioRecorder({
    onTranscription: (text) => {
      setTranscribedText(text);
      handleUserResponse(text);
    },
    isRecording,
    onRecordingStart: () => setIsRecording(true),
    onRecordingStop: () => setIsRecording(false),
  });

  const startNewInterview = async () => {
    resetInterviewStore();
    resetInterviewSetup();
    router.replace("/");
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
      setCurrentFeedback(data.feedback);

      setConversation({ role: "ai", content: data.feedback, isFeedback: true });

      // Speak feedback only
      speakTextWithTTS(data.feedback);
    } catch (error) {
      console.error("Error getting AI response:", error);
    }
  };

  useEffect(() => {
    const getFinalAssessment = async () => {
      if (!interviewSetup) return;

      if (!sessionId) {
        console.error("Session ID not found.");
        return;
      }

      if (showFinalAssessment) {
        console.log("showFinalAssessment", showFinalAssessment);
        const overallData = await submitFinalInterviewAPI(sessionId);

        setInterviewComplete(true);
        setOverallFeedback(overallData.overallFeedback);

        // Speak final summary commented for now - you know the reason
        // speakTextWithTTS(`${JSON.stringify(overallData.overallFeedback)}`);
      }
    };

    getFinalAssessment();
  }, [showFinalAssessment]);

  useEffect(() => {
    scrollRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, overallFeedback]);

  // ################################################################
  // ########## not working properly, need more focus here ##########
  // ################################################################
  useEffect(() => {
    // Push dummy state to block immediate back navigation
    history.pushState(null, "", window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      const confirmLeave = window.confirm(
        "Are you sure you want to leave the interview? Your progress will be lost."
      );

      if (confirmLeave) {
        console.log("User confirmed leave");
        router.back();
      } else {
        console.log("User chose to stay");
        history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <Card className="h-full max-w-7xl mx-auto ">
        <CardHeader>
          <CardTitle className="text-xl text-center capitalize">
            {interviewSetup?.companyName} - {interviewSetup?.jobRole} Interview
          </CardTitle>
        </CardHeader>
        <CardContent className="h-full w-full flex flex-col gap-4 ">
          {interviewStartTime && <InterviewProgress />}
          <div className="w-full h-full grid grid-cols-[1fr_2fr] gap-8 ">
            <div className="w-full h-fit">
              {/* Video call component */}
              <VideoCall
                isRecording={isRecording}
                isAISpeaking={isAISpeaking}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
              />
            </div>
            <div className="h-[65vh] 2xl:h-[72vh] w-full flex flex-col justify-between ">
              {/* scrollable div */}
              <div className="flex flex-col overflow-y-auto space-y-4 p-4 ">
                {conversation.map((message, index) => {
                  if (message?.isFeedback) {
                    return (
                      <FeedbackDisplay
                        key={index}
                        feedback={message.content}
                        type="immediate"
                      />
                    );
                  }

                  return (
                    <div
                      key={index}
                      className={`p-3 relative rounded-lg w-fit max-w-[90%] flex flex-col after:content-[''] after:absolute after:top-0  after:border-[12px] after:border-transparent  ${
                        message.role === "ai"
                          ? "bg-blue-100 text-blue-900 self-start after:left-3 after:border-t-blue-100 after:-translate-x-full"
                          : "bg-green-100 text-green-900 self-end after:right-3 after:border-t-green-100 after:translate-x-full"
                      }
                      
                      `}
                    >
                      <strong>
                        {message.role === "ai"
                          ? "🤖 AI Interviewer:"
                          : "👤 You:"}
                      </strong>
                      <p className="mt-1">{message.content}</p>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
                {interviewComplete && overallFeedback && (
                  <div ref={scrollRef}>
                    <FeedbackDisplay
                      feedback={overallFeedback}
                      type="overall"
                    />
                    <div className="mt-4 text-center">
                      <button
                        onClick={startNewInterview}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md cursor-pointer"
                      >
                        🎯 Start New Interview
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                {!interviewComplete && (
                  <ResponseInput
                    onSubmitText={handleUserResponse}
                    onStartRecording={startRecording}
                    onStopRecording={stopRecording}
                    isRecording={isRecording}
                    isAISpeaking={isAISpeaking}
                    speakTextWithTTS={speakTextWithTTS}
                    setCurrentQuestion={setCurrentQuestion}
                    isLatestFeedback={
                      conversation.length > 0
                        ? conversation[conversation.length - 1]?.isFeedback ??
                          false
                        : false
                    }
                    setShowFinalAssessment={setShowFinalAssessment}
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
