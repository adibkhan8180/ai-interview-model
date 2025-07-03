"use client";
import React, { useEffect, useState } from "react";
import { CheckCircle, CircleCheck } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useInterviewStore } from "@/lib/store/interviewStore";
import { useParams, useRouter } from "next/navigation";
import { useFormStore } from "@/lib/store/formStore";
import { submitFinalInterviewAPI } from "@/lib/api";
import { downloadFeedbackPdf } from "@/lib/downloadAssessment";

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

  const handleDownload = () => {
    downloadFeedbackPdf(overallFeedback);
  };

  if (!loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-[#F5F8FF] flex flex-col items-center h-full w-screen pt-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <img
              src="/assets/svg/Checklist.svg"
              alt="Wave SVG"
              width={32}
              height={32}
            />
            <h1 className="text-3xl">Interview Assessment</h1>
          </div>
          <div className="flex items-center space-x-2">
            <CircleCheck className="w-6 h-6 text-white fill-[#47B881]" />
            <h1 className="text-xl font-medium">Progress: Question 5 of 5</h1>
          </div>
        </div>

        <div className="border-2 border-[#E2E8F0] bg-white py-9 px-4 rounded-3xl">
          <div className="px-4">
            <p className="text-xl leading-relaxed">
              <span className="text-[#2E2E2E]">Overall Score: </span>
              <span className="text-[#3B64F6]">
                {overallFeedback?.overall_score}/100%
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

          <div className="px-4">
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
        </div>

        <div className="border-2 border-[#E2E8F0] bg-white py-9 px-8 rounded-3xl">
          <div className="border-b border-[#E2E8F0] border-dashed pb-4">
            <p className="text-xl leading-relaxed text-[#2E2E2E] text-center">
              📋 Question-wise Feedback
            </p>
          </div>

          <div className="space-y-4">
            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue="0"
            >
              {(overallFeedback?.questions_analysis || []).map(
                (section, index) => {
                  return (
                    <AccordionItem
                      value={index.toString()}
                      key={index}
                      className="bg-[#F7F9FC] mt-6 rounded-3xl px-6"
                    >
                      <AccordionTrigger>
                        Q{index + 1}: {section.question}
                      </AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-4 text-balance">
                        <div className="flex items-start space-x-3">
                          <p className="text-sm leading-relaxed text-[#2E2E2E]">
                            <span className="font-semibold">
                              🗨️ Your Answer:{" "}
                            </span>
                            {section.response}
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <p className="text-sm leading-relaxed text-[#FF6652]">
                            <span className="font-semibold">🧠 Feedback:</span>{" "}
                            {section.feedback}
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-4 h-4 mt-1 flex-shrink-0" />

                          <p className="text-sm leading-relaxed">
                            Strengths: {section.strengths}
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-4 h-4 mt-1 flex-shrink-0" />

                          <p className="text-sm leading-relaxed">
                            Improvements: {section.improvements}
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="flex items-start space-x-3 bg-[#E0ECFD] px-3.5 py-1.5 rounded-full">
                            <p className="text-sm leading-relaxed text-[#3B64F6]">
                              <span className="text-[#2E2E2E] font-semibold">
                                📊 Score:{" "}
                              </span>
                              {section.score}/10
                            </p>
                          </div>
                          <div className="flex items-start space-x-3 bg-[#E0ECFD] px-3.5 py-1.5 rounded-full">
                            <p className="text-sm leading-relaxed text-[#3B64F6]">
                              <span className="text-[#2E2E2E] font-semibold">
                                🎓 Depth:{" "}
                              </span>
                              {section.response_depth}
                            </p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                }
              )}
            </Accordion>
          </div>
        </div>

        <div className="border-2 border-[#E2E8F0] bg-white py-9 px-8 rounded-3xl">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
            <p className="text-sm leading-relaxed">
              {overallFeedback?.closure_message}
            </p>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto w-full py-3 my-2 flex justify-between space-x-6 ">
        <button
          onClick={handleDownload}
          className="py-2 w-full bg-white hover:text-[#3B57F6] text-[#3B64F6] rounded-md cursor-pointer border border-[#3B64F6]"
        >
          Download Report
        </button>
        <button
          onClick={startNewInterview}
          className="py-2 w-full bg-[#3B64F6] hover:bg-[#3B57F6] text-white rounded-md cursor-pointer"
        >
          Start New Interview
        </button>
      </div>
    </div>
  );
}

export default page;
