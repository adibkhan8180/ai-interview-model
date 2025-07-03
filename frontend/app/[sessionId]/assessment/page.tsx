"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Target, TrendingUp } from "lucide-react";
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
    setInterviewStarted,
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
    getFinalAssessment();
  }, [sessionId]);

  const startNewInterview = async () => {
    resetInterviewStore();
    resetInterviewSetup();
    setInterviewStarted(false);
    router.replace("/");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-[#F5F8FF] flex flex-col items-center h-screen w-screen pt-6">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-green-800">
                Interview Assessment
              </h3>
            </div>

            <div className="flex items-start space-x-3">
              <TrendingUp className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
              <p className="text-sm leading-relaxed text-green-700">
                Overall Score: {overallFeedback?.overall_score}
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
              <p className="text-sm leading-relaxed text-green-700">
                Overall Summary: {overallFeedback?.summary}
              </p>
            </div>

            <div className="space-y-4">
              {(overallFeedback?.questions_analysis || []).map(
                (section, index) => {
                  return (
                    <div key={index}>
                      <div className="flex items-start space-x-3">
                        <TrendingUp className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                        <p className={`text-sm leading-relaxed text-green-700`}>
                          Question: {section.question}
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Target className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                        <p className={`text-sm leading-relaxed text-blue-700`}>
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

                        <p className={`text-sm leading-relaxed text-gray-700`}>
                          Strengths: {section.strengths}
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-4 h-4 mt-1 flex-shrink-0" />

                        <p className={`text-sm leading-relaxed text-gray-700`}>
                          Improvements: {section.improvements}
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-4 h-4 mt-1 flex-shrink-0" />

                        <p className={`text-sm leading-relaxed text-gray-700`}>
                          Score: {section.score}
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-4 h-4 mt-1 flex-shrink-0" />

                        <p className={`text-sm leading-relaxed text-gray-700`}>
                          Response Depth: {section.response_depth}
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
              <p className="text-sm leading-relaxed text-green-700">
                Clarity of Motivation:{" "}
                {overallFeedback?.coaching_scores?.clarity_of_motivation}
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
              <p className="text-sm leading-relaxed text-green-700">
                Career Goal Alignment:{" "}
                {overallFeedback?.coaching_scores?.career_goal_alignment}
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
              <p className="text-sm leading-relaxed text-green-700">
                Specificity of Learning:{" "}
                {overallFeedback?.coaching_scores?.specificity_of_learning}
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
              <p className="text-sm leading-relaxed text-green-700">
                {overallFeedback?.closure_message}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 text-center">
        <button
          onClick={startNewInterview}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md cursor-pointer"
        >
          🎯 Start New Interview
        </button>
      </div>
    </div>
  );
}

export default page;
