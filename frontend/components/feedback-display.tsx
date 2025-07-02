import { Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface FeedbackDisplayProps {
  feedback: string;
}

export function FeedbackDisplay({ feedback }: FeedbackDisplayProps) {
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
