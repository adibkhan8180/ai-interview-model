import { Lightbulb } from "lucide-react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Button } from "./ui/button";
import { useInterviewStore } from "@/lib/store/interviewStore";

export function FeedbackDisplay({
  feedback,
  isLastMessage,
}: {
  feedback: string;
  isLastMessage: boolean;
}) {
  const { stopSpeaking, isAISpeaking } = useInterviewStore();
  return (
    <div className=" w-fit max-w-[90%]">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 flex items-center justify-center bg-[#FEFBED] rounded-sm">
          <Image
            src="/assets/images/bulb.png"
            alt="bulb"
            width={24}
            height={24}
          />
        </div>
        <p className="text-base font-semibold">Immediate Feedback</p>

        {isLastMessage && isAISpeaking && (
          <Button
            variant="ghost"
            className="px-4 py-2 cursor-pointer"
            onClick={stopSpeaking}
          >
            <Image
              src="/assets/svg/pause.svg"
              alt="AI"
              width={16}
              height={16}
            />
            Skip Audio
          </Button>
        )}
      </div>
      <div
        className={`p-6  border-l-4 border-[#FFC342] rounded-2xl text-sm  leading-relaxed bg-[#FFF5EA]`}
      >
        <ReactMarkdown>{feedback}</ReactMarkdown>
      </div>
    </div>
  );
}
