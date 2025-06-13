"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play } from "lucide-react"
import { FeedbackDisplay } from "@/components/feedback-display"
import { InterviewProgress } from "@/components/interview-progress"
import { VideoCall } from "@/components/video-call"
import { AudioRecorder } from "@/components/audio-recorder"
import { generateSpeech, playAudioFromArrayBuffer } from "@/services/eleven-labs"
import { InterviewSetupForm, type InterviewSetupData } from "@/components/interview-setup-form"
import { ResponseInput } from "@/components/response-input"

export default function AIInterviewSystem() {
  const [interviewSetup, setInterviewSetup] = useState<InterviewSetupData | null>(null)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [conversation, setConversation] = useState<Array<{ role: "ai" | "user"; content: string }>>([])
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [currentFeedback, setCurrentFeedback] = useState("")
  const [overallFeedback, setOverallFeedback] = useState("")
  const [interviewComplete, setInterviewComplete] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [maxQuestions] = useState(7) // Limit interview to 7 questions
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null)
  const [transcribedText, setTranscribedText] = useState("")

  // Initialize audio recorder
  const { startRecording, stopRecording } = AudioRecorder({
    onTranscription: (text) => {
      setTranscribedText(text)
      handleUserResponse(text)
    },
    isRecording,
    onRecordingStart: () => setIsRecording(true),
    onRecordingStop: () => setIsRecording(false),
  })

  const handleSetupSubmit = (data: InterviewSetupData) => {
    setInterviewSetup(data)
    startInterview(data)
  }

  const startInterview = async (setupData: InterviewSetupData) => {
    setInterviewStartTime(new Date())

    try {
      const response = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setupData),
      })

      const data = await response.json()
      setCurrentQuestion(data.firstQuestion)
      setConversation([{ role: "ai", content: data.firstQuestion }])
      setInterviewStarted(true)

      // Speak the first question using ElevenLabs
      speakTextWithElevenLabs(data.firstQuestion)
    } catch (error) {
      console.error("Error starting interview:", error)
    }
  }

  const speakTextWithElevenLabs = async (text: string) => {
    try {
      setIsAISpeaking(true)
      const audioData = await generateSpeech({ text })
      await playAudioFromArrayBuffer(audioData)
      setIsAISpeaking(false)
    } catch (error) {
      console.error("Error with ElevenLabs TTS:", error)
      // Fallback to browser TTS
      speakTextWithBrowser(text)
    }
  }

  const speakTextWithBrowser = (text: string) => {
    if ("speechSynthesis" in window) {
      setIsAISpeaking(true)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.onend = () => setIsAISpeaking(false)
      speechSynthesis.speak(utterance)
    }
  }

  const handleUserResponse = async (userResponse: string) => {
    if (!interviewSetup) return

    const newConversation = [...conversation, { role: "user" as const, content: userResponse }]
    setConversation(newConversation)
    setQuestionCount((prev) => prev + 1)

    try {
      const response = await fetch("/api/interview/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...interviewSetup,
          conversation: newConversation,
          questionCount: questionCount + 1,
          maxQuestions,
        }),
      })

      const data = await response.json()

      // Set immediate feedback
      setCurrentFeedback(data.feedback)

      if (data.isComplete) {
        setInterviewComplete(true)
        setOverallFeedback(data.overallFeedback)

        // Speak feedback and overall assessment
        speakTextWithElevenLabs(`${data.feedback} ${data.overallFeedback}`)
      } else {
        const aiResponse = data.nextQuestion
        setConversation((prev) => [
          ...prev,
          { role: "ai", content: data.feedback },
          { role: "ai", content: aiResponse },
        ])

        // Speak feedback and next question
        speakTextWithElevenLabs(`${data.feedback} ${aiResponse}`)
      }
    } catch (error) {
      console.error("Error getting AI response:", error)
    }
  }

  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-10">
          <InterviewSetupForm onSubmit={handleSetupSubmit} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {interviewSetup?.companyName} - {interviewSetup?.jobRole} Interview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {interviewStartTime && (
              <InterviewProgress
                currentQuestion={questionCount + 1}
                totalQuestions={maxQuestions}
                startTime={interviewStartTime}
              />
            )}

            {/* Video call component */}
            <VideoCall
              isRecording={isRecording}
              isAISpeaking={isAISpeaking}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
            />

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {conversation.map((message, index) => {
                const isFeedback =
                  message.role === "ai" &&
                  (message.content.startsWith("Great response!") ||
                    message.content.startsWith("Good answer!") ||
                    message.content.startsWith("Excellent point!"))

                if (isFeedback) {
                  return <FeedbackDisplay key={index} feedback={message.content} type="immediate" />
                }

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.role === "ai" ? "bg-blue-100 text-blue-900" : "bg-green-100 text-green-900 ml-8"
                    }`}
                  >
                    <strong>{message.role === "ai" ? "🤖 AI Interviewer:" : "👤 You:"}</strong>
                    <p className="mt-1">{message.content}</p>
                  </div>
                )
              })}
            </div>

            {interviewComplete && overallFeedback ? (
              <div className="mt-6">
                <FeedbackDisplay feedback={overallFeedback} type="overall" />
                <div className="mt-4 text-center">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                  >
                    🎯 Start New Interview
                  </button>
                </div>
              </div>
            ) : (
              <ResponseInput
                onSubmitText={handleUserResponse}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                isRecording={isRecording}
                isAISpeaking={isAISpeaking}
              />
            )}

            {isAISpeaking && (
              <div className="flex items-center justify-center mt-4 text-blue-600">
                <Play className="w-4 h-4 mr-2" />
                AI is speaking...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}