"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send } from "lucide-react";

interface ResponseInputProps {
  onSubmitText: (text: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  isAISpeaking: boolean;
}

export function ResponseInput({
  onSubmitText,
  onStartRecording,
  onStopRecording,
  isRecording,
  isAISpeaking,
}: ResponseInputProps) {
  const [textResponse, setTextResponse] = useState("");

  const handleSubmit = () => {
    if (textResponse.trim()) {
      onSubmitText(textResponse);
      setTextResponse("");
    }
  };

  return (
    <div className="space-y-3 ">
      <div className="flex items-center justify-center space-x-2 mb-2">
        <div className="h-px bg-gray-200 flex-grow"></div>
        <span className="text-sm text-gray-500 px-2">Respond via</span>
        <div className="h-px bg-gray-200 flex-grow"></div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex gap-4 items-end">
          <Textarea
            placeholder={
              isAISpeaking ? "AI is speaking..." : "Type your response here..."
            }
            value={textResponse}
            onChange={(e) => setTextResponse(e.target.value)}
            className="rounded-xl resize-none p-2 px-4 shadow-md"
            disabled={isRecording || isAISpeaking}
          />
          {textResponse ? (
            <div className="">
              <Button
                onClick={handleSubmit}
                disabled={!textResponse.trim() || isAISpeaking}
                className=" w-10 h-10 rounded-full cursor-pointer bg-blue-600 hover:bg-blue-700"
              >
                <Send />
              </Button>
            </div>
          ) : (
            <Button
              onClick={isRecording ? onStopRecording : onStartRecording}
              disabled={isAISpeaking}
              className={`w-10 h-10 rounded-full cursor-pointer ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600 "
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff />
                </>
              ) : (
                <>
                  <Mic />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
