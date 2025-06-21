"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";
import { FeedbackDisplay } from "@/components/feedback-display";
import { InterviewProgress } from "@/components/interview-progress";
import { VideoCall } from "@/components/video-call";
import { AudioRecorder } from "@/components/audio-recorder";
import {
  generateSpeech,
  playAudioFromArrayBuffer,
} from "@/services/text-to-speech";
import {
  InterviewSetupForm,
  type InterviewSetupData,
} from "@/components/interview-setup-form";
import { ResponseInput } from "@/components/response-input";
import { useRouter } from "next/navigation";
import {
  startInterviewAPI,
  submitAnswerAPI,
  submitFinalInterviewAPI,
} from "@/lib/api";

export default function AIInterviewSystem() {
  const router = useRouter();
  const [interviewSetup, setInterviewSetup] =
    useState<InterviewSetupData | null>(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [conversation, setConversation] = useState<
    Array<{ role: "ai" | "user"; content: string; isFeedback?: boolean }>
  >([
    { role: "ai", content: "Hi! How can I help you today?", isFeedback: true },
  ]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentFeedback, setCurrentFeedback] = useState("");
  const [overallFeedback, setOverallFeedback] = useState({
    overall_score: 60,
    summary:
      "The candidate demonstrated a strong technical background in software development and showcased experience with relevant technologies. However, the lack of specific examples and depth in responses impacted the assessment.",
    questions_analysis: [],
    skill_assessment: {
      communication: 6,
      technical_knowledge: 7,
      problem_solving: 6,
      cultural_fit: 7,
    },
    coaching_scores: {
      clarity_of_motivation: 3,
      specificity_of_learning: 2,
      career_goal_alignment: 3,
    },
    recommendations: [
      "Provide more specific examples to showcase your experience and problem-solving skills.",
      "Work on articulating your motivations and career goals with more clarity and alignment to the role.",
    ],
    closure_message:
      "Thank you for sharing your experiences and goals with us. Keep refining your responses to provide more depth and specificity in future interviews. Best of luck in your future endeavors!",
  });
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [maxQuestions] = useState(2); // Limit interview to 7 questions
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(
    null
  );
  const [transcribedText, setTranscribedText] = useState("");
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

  const handleSetupSubmit = (data: InterviewSetupData) => {
    setInterviewSetup(data);
    startInterview(data);
  };

  const startInterview = async (setupData: InterviewSetupData) => {
    if (loading) return;

    setLoading(true);
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

      console.log(data);
      localStorage.setItem("sessionId", data.sessionId);

      setQuestionCount((prev) => prev + 1);
      setCurrentQuestion(data.question);
      setConversation([
        {
          role: "ai",
          content: data.question,
          isFeedback: data.isFeedback ?? false,
        },
      ]);
      setInterviewStarted(true);

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

  const handleUserResponse = async (userResponse: string) => {
    if (!interviewSetup) return;

    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      console.error("Session ID not found.");
      return;
    }

    const newConversation = [
      ...conversation,
      { role: "user" as const, content: userResponse },
    ];
    setConversation(newConversation);

    try {
      const data = await submitAnswerAPI(sessionId, userResponse);
      setCurrentFeedback(data.feedback);

      if (questionCount >= maxQuestions) {
        const overallData = await submitFinalInterviewAPI(sessionId);

        setConversation((prev) => [
          ...prev,
          { role: "ai", content: data.feedback, isFeedback: true },
        ]);

        setInterviewComplete(true);
        setOverallFeedback(overallData.overallFeedback);

        // Speak both feedback and final summary
        speakTextWithTTS(
          `${data.feedback} ${JSON.stringify(overallData.overallFeedback)}`
        );
      } else {
        setConversation((prev) => [
          ...prev,
          { role: "ai", content: data.feedback, isFeedback: true },
          // Optional: add nextQuestion if needed
          // { role: "ai", content: data.nextQuestion },
        ]);

        // Speak feedback only
        speakTextWithTTS(data.feedback);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
    }
  };

  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-10">
          <InterviewSetupForm onSubmit={handleSetupSubmit} loading={loading} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <Card className="h-full max-w-7xl mx-auto ">
        <CardHeader>
          <CardTitle className="text-xl text-center capitalize">
            {interviewSetup?.companyName} - {interviewSetup?.jobRole} Interview
          </CardTitle>
        </CardHeader>
        <CardContent className="h-full w-full flex flex-col gap-4 ">
          {interviewStartTime && (
            <InterviewProgress
              currentQuestion={questionCount}
              totalQuestions={maxQuestions}
              startTime={interviewStartTime}
            />
          )}
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
                {interviewComplete && overallFeedback && (
                  <div className="">
                    <FeedbackDisplay
                      feedback={overallFeedback}
                      type="overall"
                    />
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
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
                    setConversation={setConversation}
                    speakTextWithTTS={speakTextWithTTS}
                    setCurrentQuestion={setCurrentQuestion}
                    setQuestionCount={setQuestionCount}
                    isLatestFeedback={
                      conversation[conversation.length - 1].isFeedback || false
                    }
                    interviewComplete={interviewComplete}
                  />
                )}

                {/* {isAISpeaking && (
                    <div className="flex items-center justify-center mt-4 text-blue-600">
                      <Play className="w-4 h-4 mr-2" />
                      AI is speaking...
                    </div>
                  )} */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
