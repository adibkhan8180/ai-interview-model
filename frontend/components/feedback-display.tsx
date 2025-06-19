import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Lightbulb, Target, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";

interface OverallFeedback {
  overall_score: number;
  summary: string;
  questions_analysis: Array<any>;
  skill_assessment: {
    communication: number;
    technical_knowledge: number;
    problem_solving: number;
    cultural_fit: number;
  };
  coaching_scores: {
    clarity_of_motivation: number;
    specificity_of_learning: number;
    career_goal_alignment: number;
  };
  recommendations: string[];
  closure_message: string;
}
interface FeedbackDisplayProps {
  feedback: string | OverallFeedback;
  type: "immediate" | "overall";
  setConversation: React.Dispatch<
    React.SetStateAction<
      Array<{ role: "ai" | "user"; content: string; isFeedback?: boolean }>
    >
  >;
  speakTextWithTTS: (text: string) => Promise<void>;
  setCurrentQuestion: React.Dispatch<React.SetStateAction<string>>;
  isAISpeaking: boolean;
  isLatestFeedback?: boolean;
  interviewComplete?: boolean;
}

export function FeedbackDisplay({
  feedback,
  type,
  setConversation,
  speakTextWithTTS,
  setCurrentQuestion,
  isAISpeaking,
  isLatestFeedback,
  interviewComplete,
}: FeedbackDisplayProps) {
  if (type === "immediate") {
    if (typeof feedback !== "string") {
      return null;
    }
    const handleReviseQuestion = async () => {
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL
          }/api/interviews/${localStorage.getItem("sessionId")}/revise`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        const data = await response.json();

        setConversation((prev) => [
          ...prev,
          { role: "ai", content: data.question, isFeedback: false },
        ]);

        speakTextWithTTS(data.question);
      } catch (error) {
        console.error("Error reviseing answer:", error);
      }
    };

    const getNextQuestion = async () => {
      try {
        const questionResponse = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL
          }/api/interviews/${localStorage.getItem("sessionId")}/questions`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        const questionData = await questionResponse.json();
        setCurrentQuestion(questionData?.question);
        setConversation((prev) => [
          ...prev,
          { role: "ai", content: questionData?.question, isFeedback: false },
        ]);
        speakTextWithTTS(questionData?.question);
      } catch (error) {
        console.error("Error getting next question:", error);
      }
    };

    return (
      <div>
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded-lg my-3">
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">
                💡 Immediate Feedback
              </h4>
              <p className="text-yellow-700 text-sm leading-relaxed">
                {feedback}
              </p>
            </div>
          </div>
        </div>
        {!interviewComplete && isLatestFeedback && (
          <div className="flex items-center justify-center gap-5">
            <p className="text-yellow-700 text-sm leading-relaxed">
              Do you want to revise the answer?
            </p>
            <Button
              onClick={handleReviseQuestion}
              disabled={isAISpeaking}
              className="bg-green-500 hover:bg-green-600"
            >
              yes
            </Button>
            <Button
              onClick={getNextQuestion}
              disabled={isAISpeaking}
              className="bg-red-500 hover:bg-red-600"
            >
              No
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (typeof feedback === "string") {
    return null;
  }

  // Parse overall feedback into sections
  // const sections = feedback.split("\n").filter((line) => line.trim());

  return (
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
            Overall Score: {feedback?.overall_score}
          </p>
        </div>

        <div className="flex items-start space-x-3">
          <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
          <p className="text-sm leading-relaxed text-green-700">
            Overall Summary: {feedback?.summary}
          </p>
        </div>

        <div className="space-y-4">
          {(feedback?.questions_analysis || []).map((section, index) => {
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

                  <p className={`text-sm leading-relaxed text-purple-700`}>
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
          })}
        </div>

        <div className="flex items-start space-x-3">
          <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
          <p className="text-sm leading-relaxed text-green-700">
            Clarity of Motivation:{" "}
            {feedback?.coaching_scores?.clarity_of_motivation}
          </p>
        </div>
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
          <p className="text-sm leading-relaxed text-green-700">
            Career Goal Alignment:{" "}
            {feedback?.coaching_scores.career_goal_alignment}
          </p>
        </div>
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
          <p className="text-sm leading-relaxed text-green-700">
            Specificity of Learning:{" "}
            {feedback?.coaching_scores.specificity_of_learning}
          </p>
        </div>
        <div className="space-y-4">
          {feedback?.recommendations.map((section, index) => {
            return (
              <div key={index} className="flex items-start space-x-3">
                <TrendingUp className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                <p className="text-sm leading-relaxed text-gray-700">
                  Recommendation {index + 1}: {section}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
          <p className="text-sm leading-relaxed text-green-700">
            {feedback?.closure_message}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
