"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Volume2,
  VolumeOff,
} from "lucide-react";
import Image from "next/image";
import { useInterviewStore } from "@/lib/store/interviewStore";

import interviewerBg from "@/public/assets/images/interviewerBg.png";

interface VideoCallProps {
  isRecording: boolean;
  isAISpeaking: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function VideoCall({
  isRecording,
  isAISpeaking,
  onStartRecording,
  onStopRecording,
}: VideoCallProps) {
  const { stopSpeaking } = useInterviewStore();
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (userVideoRef.current) {
          userVideoRef.current.srcObject = mediaStream;
        }

        setStream(mediaStream);
        setCameraEnabled(true);
        setMicEnabled(true);
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !cameraEnabled;
        setCameraEnabled(!cameraEnabled);
      }
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micEnabled;
        setMicEnabled(!micEnabled);

        // if (!micEnabled) {
        //   onStartRecording()
        // } else {
        //   onStopRecording()
        // }
      }
    }
  };

  return (
    <div className="flex flex-col sm:flex-row md:flex-col-reverse gap-4 ">
      <Card className="overflow-hidden bg-black relative w-full aspect-[4/3]">
        <video
          ref={userVideoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${
            !cameraEnabled ? "invisible" : ""
          }`}
        />

        <div className="absolute top-4 left-4 text-white bg-[#808080] bg-opacity-75 px-4 py-2 rounded-3xl text-base">
          You
        </div>

        {!cameraEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-white text-center">
              <CameraOff className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Camera is off</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center space-x-2">
          <button
            onClick={toggleCamera}
            className={`p-2 rounded-full ${
              cameraEnabled
                ? "bg-gray-700 hover:bg-[#808080]"
                : "bg-red-600 hover:bg-[#E01F00]"
            }`}
          >
            {cameraEnabled ? (
              <Camera className="w-4 h-4 text-white" />
            ) : (
              <CameraOff className="w-4 h-4 text-white" />
            )}
          </button>

          <button
            onClick={toggleMic}
            className={`p-2 rounded-full ${
              micEnabled
                ? "bg-gray-700 hover:bg-[#808080]"
                : "bg-red-600 hover:bg-[#E01F00]"
            }`}
          >
            {micEnabled ? (
              <Mic className="w-4 h-4 text-white" />
            ) : (
              <MicOff className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden bg-gradient-to-b from-blue-900 to-indigo-900 relative w-full aspect-[4/3]">
        <img
          src="/assets/images/interviewerBg.png"
          className="w-full h-full inset-0 absolute object-cover"
          alt=""
        />
        <div className="absolute inset-0 flex flex-col gap-8 items-center justify-center">
          <div className="relative w-full flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white z-10" />
            <Image
              src="/assets/svg/voicePulse.svg"
              alt="pulse"
              className={`absolute ${isAISpeaking && "animate-pulse"}`}
              width={200}
              height={200}
            />
          </div>
          <div className="w-full items-center justify-center flex flex-col gap-2">
            <p className="text-white font-medium">AI Interviewer</p>
            <div className="">
              {!isAISpeaking && (
                <div className="text-white text-sm">
                  Waiting for your response...
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
