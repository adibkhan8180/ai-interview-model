export async function POST(req: Request) {
  try {
    const { text, voiceId, stability, similarityBoost, modelId } = await req.json()

    if (!text) {
      return Response.json({ error: "Text is required" }, { status: 400 })
    }

    const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY

    if (!ELEVEN_LABS_API_KEY) {
      return Response.json({ error: "ElevenLabs API key is not configured" }, { status: 500 })
    }

    const options = {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_LABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId || "eleven_monolingual_v1",
        voice_settings: {
          stability: stability || 0.5,
          similarity_boost: similarityBoost || 0.75,
        },
      }),
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || "21m00Tcm4TlvDq8ikWAM"}`,
      options,
    )

    if (!response.ok) {
      const errorText = await response.text()
      return Response.json({ error: `ElevenLabs API error: ${errorText}` }, { status: response.status })
    }

    const audioBuffer = await response.arrayBuffer()

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("Text-to-speech error:", error)
    return Response.json({ error: "Failed to generate speech" }, { status: 500 })
  }
}
