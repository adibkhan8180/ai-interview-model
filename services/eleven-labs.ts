export interface ElevenLabsOptions {
  text: string
  voiceId?: string
  stability?: number
  similarityBoost?: number
  modelId?: string
}

export async function generateSpeech({
  text,
  voiceId = "21m00Tcm4TlvDq8ikWAM", // Default voice ID (Rachel)
  stability = 0.5,
  similarityBoost = 0.75,
  modelId = "eleven_monolingual_v1",
}: ElevenLabsOptions): Promise<ArrayBuffer> {
  const response = await fetch(`/api/text-to-speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      voiceId,
      stability,
      similarityBoost,
      modelId,
    }),
  })

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`)
  }

  return await response.arrayBuffer()
}

export function playAudioFromArrayBuffer(audioData: ArrayBuffer): Promise<void> {
  return new Promise((resolve) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    audioContext.decodeAudioData(audioData, (buffer) => {
      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.destination)
      source.start(0)

      source.onended = () => {
        resolve()
      }
    })
  })
}
