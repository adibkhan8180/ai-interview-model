"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, Play } from "lucide-react"
import { FeedbackDisplay } from "@/components/feedback-display"
import { InterviewProgress } from "@/components/interview-progress"
import { VideoCall } from "@/components/video-call"
import { AudioRecorder } from "@/components/audio-recorder"
import { generateSpeech, playAudioFromArrayBuffer } from "@/services/eleven-labs"

export default function AIInterviewSystem() {
  const [jobDescription, setJobDescription] = useState("")
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

  const startInterview = async () => {
    if (!jobDescription.trim()) {
      alert("Please enter a job description first")
      return
    }

    setInterviewStartTime(new Date())

    try {
      const response = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
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
    const newConversation = [...conversation, { role: "user" as const, content: userResponse }]
    setConversation(newConversation)
    setQuestionCount((prev) => prev + 1)

    try {
      const response = await fetch("/api/interview/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
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
        <div className="max-w-2xl mx-auto pt-20">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">AI Video Interview Assistant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Enter Job Description</label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here. The AI will conduct a video interview based on this role..."
                  className="min-h-[200px]"
                />
              </div>
              <Button onClick={startInterview} className="w-full" disabled={!jobDescription.trim()}>
                Start AI Video Interview
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">AI Video Interview in Progress</CardTitle>
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

            {interviewComplete && overallFeedback && !isAISpeaking && (
              <div className="mt-6">
                <FeedbackDisplay feedback={overallFeedback} type="overall" />
                <div className="mt-4 text-center">
                  <Button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-700">
                    🎯 Start New Interview
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              {!interviewComplete && !overallFeedback && (
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isAISpeaking}
                  className={`${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
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
              )}
              {isAISpeaking && (
                <div className="flex items-center text-blue-600">
                  <Play className="w-4 h-4 mr-2" />
                  AI is speaking...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}