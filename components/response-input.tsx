"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, Send } from "lucide-react"

interface ResponseInputProps {
  onSubmitText: (text: string) => void
  onStartRecording: () => void
  onStopRecording: () => void
  isRecording: boolean
  isAISpeaking: boolean
}

export function ResponseInput({
  onSubmitText,
  onStartRecording,
  onStopRecording,
  isRecording,
  isAISpeaking,
}: ResponseInputProps) {
  const [textResponse, setTextResponse] = useState("")

  const handleSubmit = () => {
    if (textResponse.trim()) {
      onSubmitText(textResponse)
      setTextResponse("")
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-center space-x-2 mb-2">
        <div className="h-px bg-gray-200 flex-grow"></div>
        <span className="text-sm text-gray-500 px-2">Respond via</span>
        <div className="h-px bg-gray-200 flex-grow"></div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Textarea
            placeholder="Type your response here..."
            value={textResponse}
            onChange={(e) => setTextResponse(e.target.value)}
            className="min-h-[80px]"
            disabled={isRecording}
          />
          <div className="flex justify-end mt-2">
            <Button
              onClick={handleSubmit}
              disabled={!textResponse.trim() || isAISpeaking}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <span className="hidden md:inline text-gray-500 mx-2">or</span>
          <Button
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isAISpeaking}
            className={`${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Start Speaking
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
