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
  const [questionCount, setQuestionCount] = useState(1);
  const [maxQuestions] = useState(5); // Limit interview to 7 questions
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(
    null
  );
  const [transcribedText, setTranscribedText] = useState("");

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
    setInterviewStartTime(new Date());
    const { companyName, jobRole, jobDescription, domain, interviewCategory } =
      setupData;

    if (!companyName || !jobRole || !interviewCategory) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/interviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName,
            jobRole,
            jobDescription,
            domain,
            interviewType: interviewCategory,
          }),
        }
      );

      const data = await response.json();
      if (data.success !== true) {
        console.log("failed to generate sessionId");
        throw new Error("Failed to start interview. Please try again.");
      }

      localStorage.setItem("sessionId", data.sessionId);

      const questionResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/interviews/${data.sessionId}/questions`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const questionData = await questionResponse.json();
      console.log("hello===>>>", questionData);
      setCurrentQuestion(questionData?.question);
      setConversation([
        {
          role: "ai",
          content: questionData?.question,
          isFeedback: questionData?.isFeedback ? true : false,
        },
      ]);
      setInterviewStarted(true);
      // router.replace(`/${data.sessionId}`);

      speakTextWithTTS(questionData?.question);
    } catch (error) {
      console.error("Error starting interview:", error);
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

    const newConversation = [
      ...conversation,
      { role: "user" as const, content: userResponse },
    ];
    setConversation(newConversation);
    setQuestionCount((prev) => prev + 1);

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL
        }/api/interviews/${localStorage.getItem("sessionId")}/answers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answer: userResponse,
          }),
        }
      );

      const data = await response.json();
      // Set immediate feedback
      setCurrentFeedback(data?.feedback);

      if (questionCount >= maxQuestions) {
        const finalResponse = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL
          }/api/interviews/${localStorage.getItem("sessionId")}/submit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        const overallData = await finalResponse.json();
        setConversation((prev) => [
          ...prev,
          { role: "ai", content: data.feedback, isFeedback: true },
        ]);

        setInterviewComplete(true);
        setOverallFeedback(overallData.overallFeedback);

        // Speak feedback and overall assessment
        speakTextWithTTS(
          `${data.feedback} ${JSON.stringify(overallData.overallFeedback)}`
        );
      } else {
        const aiResponse = data.nextQuestion;
        setConversation((prev) => [
          ...prev,
          { role: "ai", content: data.feedback, isFeedback: true },
          // { role: "ai", content: aiResponse },
        ]);

        // Speak feedback and next question
        // speakTextWithTTS(`${data.feedback} ${aiResponse}`);
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
          <InterviewSetupForm onSubmit={handleSetupSubmit} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {interviewSetup?.companyName} - {interviewSetup?.jobRole}{" "}
              Interview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {interviewStartTime && (
              <InterviewProgress
                currentQuestion={questionCount}
                totalQuestions={maxQuestions}
                startTime={interviewStartTime}
              />
            )}

            {/* Video call component */}
            <VideoCall
              isRecording={isRecording}
              isAISpeaking={isAISpeaking}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
            />

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {conversation.map((message, index) => {
                if (message?.isFeedback) {
                  return (
                    <FeedbackDisplay
                      key={index}
                      feedback={message.content}
                      type="immediate"
                      setConversation={setConversation}
                      speakTextWithTTS={speakTextWithTTS}
                      setCurrentQuestion={setCurrentQuestion}
                      isAISpeaking={isAISpeaking}
                      isLatestFeedback={index === conversation.length - 1}
                    />
                  );
                }

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.role === "ai"
                        ? "bg-blue-100 text-blue-900"
                        : "bg-green-100 text-green-900 ml-8"
                    }`}
                  >
                    <strong>
                      {message.role === "ai" ? "🤖 AI Interviewer:" : "👤 You:"}
                    </strong>
                    <p className="mt-1">{message.content}</p>
                  </div>
                );
              })}
            </div>

            <div></div>

            {interviewComplete && overallFeedback ? (
              <div className="mt-6">
                <FeedbackDisplay
                  feedback={overallFeedback}
                  type="overall"
                  setConversation={setConversation}
                  speakTextWithTTS={speakTextWithTTS}
                  setCurrentQuestion={setCurrentQuestion}
                  isAISpeaking={isAISpeaking}
                  isLatestFeedback={false}
                  interviewComplete={interviewComplete}
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
            ) : (
              <ResponseInput
                onSubmitText={handleUserResponse}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                isRecording={isRecording}
                isAISpeaking={isAISpeaking}
              />
            )}

            {isAISpeaking && (
              <div className="flex items-center justify-center mt-4 text-blue-600">
                <Play className="w-4 h-4 mr-2" />
                AI is speaking...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
