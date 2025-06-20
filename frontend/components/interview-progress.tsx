import { Progress } from "@/components/ui/progress";
import { Clock, MessageSquare } from "lucide-react";

interface InterviewProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  startTime: Date;
}

export function InterviewProgress({
  currentQuestion,
  totalQuestions,
  startTime,
}: InterviewProgressProps) {
  const progress = (currentQuestion / totalQuestions) * 100;
  const elapsedTime = Math.floor(
    (Date.now() - startTime.getTime()) / 1000 / 60
  ); // minutes

  return (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            Question {currentQuestion} of {totalQuestions}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">{elapsedTime} min</span>
        </div>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
