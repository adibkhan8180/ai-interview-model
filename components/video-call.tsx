"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, Camera, CameraOff, Volume2 } from "lucide-react"
import Image from "next/image"

interface VideoCallProps {
  isRecording: boolean
  isAISpeaking: boolean
  onStartRecording: () => void
  onStopRecording: () => void
}

export function VideoCall({ isRecording, isAISpeaking, onStartRecording, onStopRecording }: VideoCallProps) {
  const userVideoRef = useRef<HTMLVideoElement>(null)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    // Initialize camera when component mounts
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        if (userVideoRef.current) {
          userVideoRef.current.srcObject = mediaStream
        }

        setStream(mediaStream)
        setCameraEnabled(true)
        setMicEnabled(true)
      } catch (error) {
        console.error("Error accessing camera:", error)
      }
    }

    initCamera()

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop()
        })
      }
    }
  }, [])

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !cameraEnabled
        setCameraEnabled(!cameraEnabled)
      }
    }
  }

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !micEnabled
        setMicEnabled(!micEnabled)

        if (!micEnabled) {
          onStartRecording()
        } else {
          onStopRecording()
        }
      }
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* User video */}
      <Card className="overflow-hidden bg-black relative">
        <video
          ref={userVideoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-[240px] object-cover ${!cameraEnabled ? "invisible" : ""}`}
        />

        {!cameraEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-white text-center">
              <CameraOff className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Camera is off</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-3 text-white bg-gray-800 bg-opacity-75 px-2 py-1 rounded-md text-sm">
          You
        </div>

        <div className="absolute bottom-3 right-3 flex space-x-2">
          <button
            onClick={toggleCamera}
            className={`p-2 rounded-full ${
              cameraEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-500"
            }`}
          >
            {cameraEnabled ? <Camera className="w-4 h-4 text-white" /> : <CameraOff className="w-4 h-4 text-white" />}
          </button>

          <button
            onClick={toggleMic}
            className={`p-2 rounded-full ${
              micEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-500"
            }`}
          >
            {micEnabled ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
          </button>
        </div>
      </Card>

      {/* AI interviewer */}
      <Card className="overflow-hidden bg-gradient-to-b from-blue-900 to-indigo-900 relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative w-24 h-24 mb-3">
            <Image
              src="/AI-Interviewer.png"
              alt="AI Interviewer"
              width={96}
              height={96}
              className="rounded-full border-2 border-blue-400"
            />
            {isAISpeaking && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 p-1 rounded-full">
                <Volume2 className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <p className="text-white font-medium">AI Interviewer</p>
          <div className="mt-3">
            {isAISpeaking ? (
              <Image
                  src="/AIVoiceEffectCrop.gif"
                  alt="AI Interviewer"
                  width={50}
                  height={50}
                  className="rounded-full border-2 border-blue-400"
                />
            ) : (
              <div className="text-blue-300 text-sm">Waiting for your response...</div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
