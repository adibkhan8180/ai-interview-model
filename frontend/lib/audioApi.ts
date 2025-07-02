import { useInterviewStore } from "./store/interviewStore";
import {
  generateSpeech,
  playAudioFromArrayBuffer,
} from "@/services/text-to-speech";

export const speakTextWithTTS = async (text: string) => {
  try {
    useInterviewStore.getState().setIsAISpeaking(true);
    const audioData = await generateSpeech({ text });
    const audio = new Audio(URL.createObjectURL(new Blob([audioData])));
    useInterviewStore.getState().setAudioInstance(audio);

    audio.onended = () => {
      useInterviewStore.getState().setIsAISpeaking(false);
      useInterviewStore.getState().setAudioInstance(null);
    };

    audio.play();
  } catch (error) {
    console.error("Error with TTS:", error);
    speakTextWithBrowser(text);
  }
};

const speakTextWithBrowser = (text: string) => {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    useInterviewStore.getState().setIsAISpeaking(true);
    useInterviewStore.getState().setBrowserUtterance(utterance);

    utterance.onend = () => {
      useInterviewStore.getState().setIsAISpeaking(false);
      useInterviewStore.getState().setBrowserUtterance(null);
    };

    speechSynthesis.speak(utterance);
  }
};
