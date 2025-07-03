"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  CircleCheck,
  NotebookPen,
  Target,
  TrendingUp,
} from "lucide-react";
import { useInterviewStore } from "@/lib/store/interviewStore";
import { useParams, useRouter } from "next/navigation";
import { useFormStore } from "@/lib/store/formStore";
import { submitFinalInterviewAPI } from "@/lib/api";

function page() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const { resetForm: resetInterviewSetup } = useFormStore();
  const {
    overallFeedback,
    resetStore: resetInterviewStore,
    setOverallFeedback,
    setInterviewComplete,
  } = useInterviewStore();
  const [loading, setLoading] = useState(true);

  const getFinalAssessment = async () => {
    if (!sessionId) {
      console.error("Session ID not found.");
      return;
    }
    try {
      const overallData = await submitFinalInterviewAPI(sessionId);
      //@ts-expect-error
      if (overallData.status && overallData.status === "error") {
        console.error("Error fetching final assessment data:", overallData);
        return;
      }

      console.log("final assessment data", overallData);
      setInterviewComplete(true);
      setOverallFeedback(overallData.overallFeedback);

      // uncomment this line if  you want to use TTS for overall feedback
      // speakTextWithTTS(`${JSON.stringify(overallData.overallFeedback)}`);
    } catch (error) {
      console.error("Error getting next question:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // getFinalAssessment();
  }, [sessionId]);

  const startNewInterview = async () => {
    resetInterviewStore();
    resetInterviewSetup();
    router.replace("/");
  };

  if (!loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-[#F5F8FF] flex flex-col items-center h-full w-screen pt-6">
      <div>
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <NotebookPen className="w-6 h-6" />
            <h1 className="text-3xl">Interview Assessment</h1>
          </div>
          <div className="flex items-center space-x-2">
            <CircleCheck className="w-6 h-6" />
            <h1>Progress: Question 5 of 5</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Card className="border-2 border-[#E2E8F0] bg-white">
            <CardContent className="px-4 py-2">
              <div className="">
                <p className="text-xl leading-relaxed">
                  <span className="text-[#2E2E2E]">Overall Score: </span>
                  <span className="text-[#3B64F6]">
                    {overallFeedback?.overall_score}%
                  </span>
                </p>
              </div>

              <div className="bg-[#F7F9FC] rounded-2xl p-4 mt-9 mb-6">
                <p className="text-[16px] font-semibold leading-relaxed text-[#4A5A75]">
                  Summary:
                </p>
                <p className="text-[16px] font-medium leading-relaxed text-[#4A5A75]">
                  {overallFeedback?.summary}
                </p>
              </div>

              <div className="">
                <p className="text-[16px] font-medium leading-relaxed text-[#2E2E2E]">
                  Clarity of Motivation:
                  {overallFeedback?.coaching_scores?.clarity_of_motivation}
                </p>
                <p className="text-[16px] font-medium leading-relaxed text-[#2E2E2E]">
                  Career Goal Alignment:
                  {overallFeedback?.coaching_scores?.career_goal_alignment}
                </p>
                <p className="text-[16px] font-medium leading-relaxed text-[#2E2E2E]">
                  Specificity of Learning:
                  {overallFeedback?.coaching_scores?.specificity_of_learning}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Card className="border-2 border-[#E2E8F0] bg-white">
            <CardContent className="px-4 py-2">
              <div className="border-b border-[#E2E8F0] border-dashed pb-4">
                <p className="text-xl leading-relaxed text-[#2E2E2E] text-center">
                  📋 Question-wise Feedback
                </p>
              </div>

              <div className="space-y-4">
                {(overallFeedback?.questions_analysis || []).map(
                  (section, index) => {
                    return (
                      <div key={index}>
                        <div className="flex items-start space-x-3">
                          <TrendingUp className="w-4 h-4 mt-1 flex-shrink-0" />
                          <p className={`text-sm leading-relaxed`}>
                            Question: {section.question}
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Target className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                          <p
                            className={`text-sm leading-relaxed text-blue-700`}
                          >
                            Response: {section.response}
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />

                          <p
                            className={`text-sm leading-relaxed text-purple-700`}
                          >
                            Feedback: {section.feedback}
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-4 h-4 mt-1 flex-shrink-0" />

                          <p
                            className={`text-sm leading-relaxed text-gray-700`}
                          >
                            Strengths: {section.strengths}
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-4 h-4 mt-1 flex-shrink-0" />

                          <p
                            className={`text-sm leading-relaxed text-gray-700`}
                          >
                            Improvements: {section.improvements}
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-4 h-4 mt-1 flex-shrink-0" />

                          <p
                            className={`text-sm leading-relaxed text-gray-700`}
                          >
                            Score: {section.score}
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-4 h-4 mt-1 flex-shrink-0" />

                          <p
                            className={`text-sm leading-relaxed text-gray-700`}
                          >
                            Response Depth: {section.response_depth}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Card className="border-2 border-[#E2E8F0] bg-white">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                <p className="text-sm leading-relaxed">
                  {overallFeedback?.closure_message}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={startNewInterview}
            className="px-4 py-2 bg-[#3B64F6] hover:bg-[#3B57F6] text-white rounded-md cursor-pointer"
          >
            🎯 Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
}

export default page;
