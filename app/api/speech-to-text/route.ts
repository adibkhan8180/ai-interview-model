import type { NextRequest } from "next/server"
import { OpenAI } from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return Response.json({ error: "Audio file is required" }, { status: 400 })
    }

    // Convert File to Buffer for OpenAI API
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create a temporary file for OpenAI API
    const tempFileName = `speech-${Date.now()}.webm`

    // Use OpenAI's Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: new File([buffer], tempFileName, { type: audioFile.type }),
      model: "whisper-1",
      language: "en",
    })

    return Response.json({ transcript: transcription.text })
  } catch (error) {
    console.error("Speech-to-text error:", error)
    return Response.json({ error: "Failed to transcribe speech" }, { status: 500 })
  }
}
