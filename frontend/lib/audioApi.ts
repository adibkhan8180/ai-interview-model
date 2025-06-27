import { useInterviewStore } from "./store/interviewStore";
import {
  generateSpeech,
  playAudioFromArrayBuffer,
} from "@/services/text-to-speech";

export const speakTextWithTTS = async (text: string) => {
  try {
    useInterviewStore.getState().setIsAISpeaking(true);
    const audioData = await generateSpeech({ text });
    await playAudioFromArrayBuffer(audioData);
    useInterviewStore.getState().setIsAISpeaking(false);
  } catch (error) {
    console.error("Error with TTS:", error);
    speakTextWithBrowser(text);
  }
};

const speakTextWithBrowser = (text: string) => {
  if ("speechSynthesis" in window) {
    useInterviewStore.getState().setIsAISpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => useInterviewStore.getState().setIsAISpeaking(false);
    speechSynthesis.speak(utterance);
  }
};
