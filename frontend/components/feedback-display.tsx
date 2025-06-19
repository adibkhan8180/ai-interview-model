import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Lightbulb, Target, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
interface FeedbackDisplayProps {
  feedback: string;
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
}
export function FeedbackDisplay({
  feedback,
  type,
  setConversation,
  speakTextWithTTS,
  setCurrentQuestion,
  isAISpeaking,
  isLatestFeedback,
}: FeedbackDisplayProps) {
  if (type === "immediate") {
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
        {isLatestFeedback && (
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

  // Parse overall feedback into sections
  const sections = feedback.split("\n").filter((line) => line.trim());

  return (
    <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-bold text-green-800">
            Interview Assessment
          </h3>
        </div>

        <div className="space-y-4">
          {sections.map((section, index) => {
            const isStrengths =
              section.toLowerCase().includes("strength") ||
              section.toLowerCase().includes("good") ||
              section.toLowerCase().includes("excellent");
            const isImprovement =
              section.toLowerCase().includes("improve") ||
              section.toLowerCase().includes("develop") ||
              section.toLowerCase().includes("consider");
            const isRating =
              section.toLowerCase().includes("rating") ||
              section.toLowerCase().includes("overall");

            return (
              <div key={index} className="flex items-start space-x-3">
                {isStrengths && (
                  <TrendingUp className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                )}
                {isImprovement && (
                  <Target className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                )}
                {isRating && (
                  <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                )}
                {!isStrengths && !isImprovement && !isRating && (
                  <div className="w-4 h-4 mt-1 flex-shrink-0" />
                )}

                <p
                  className={`text-sm leading-relaxed ${
                    isStrengths
                      ? "text-green-700"
                      : isImprovement
                      ? "text-blue-700"
                      : isRating
                      ? "text-purple-700"
                      : "text-gray-700"
                  }`}
                >
                  {section}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
