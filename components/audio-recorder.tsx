"use client"

import { useRef } from "react"

interface AudioRecorderProps {
  onTranscription: (text: string) => void
  isRecording: boolean
  onRecordingStart: () => void
  onRecordingStop: () => void
}

export function AudioRecorder({ onTranscription, isRecording, onRecordingStart, onRecordingStop }: AudioRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        await sendAudioForTranscription(audioBlob)

        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      onRecordingStart()
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      onRecordingStop()
    }
  }

  const sendAudioForTranscription = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob)

      const response = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.transcript) {
        onTranscription(data.transcript)
      }
    } catch (error) {
      console.error("Error transcribing audio:", error)
    }
  }

  return { startRecording, stopRecording }
}
