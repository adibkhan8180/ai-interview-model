import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Lightbulb, Target, TrendingUp } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
}

export function FeedbackDisplay({ feedback, type }: FeedbackDisplayProps) {
  if (type === "immediate") {
    if (typeof feedback !== "string") {
      return null;
    }

    return (
      <div>
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded-lg w-fit max-w-[90%]">
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">
                💡 Immediate Feedback
              </h4>
              <div className="text-yellow-700 text-sm leading-relaxed">
                <ReactMarkdown>{feedback}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (typeof feedback === "string") {
    return null;
  }

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
            {feedback?.coaching_scores?.career_goal_alignment}
          </p>
        </div>
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
          <p className="text-sm leading-relaxed text-green-700">
            Specificity of Learning:{" "}
            {feedback?.coaching_scores?.specificity_of_learning}
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
