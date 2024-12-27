"use client";

import React, { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { useAtom } from "jotai";
import {
  clientSideApiKeyAtom,
  clientSideLLMCallEnabledAtom,
  recognitionAtom,
  recordingAtom,
} from "~/utils/atoms";

import { callLLMFromClient } from "~/utils/llm/llmFromClient";

const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

if (!SpeechRecognition && typeof window !== "undefined") {
  alert("このブラウザは音声認識APIをサポートしていません。");
}

const rec = SpeechRecognition && new SpeechRecognition();

interface AudioDevice {
  deviceId: string;
  label: string;
}

export default function useRecognition(
  onFinalResult?: (text: string) => void,
  onIntrimResult?: (text: string) => void,
): [AudioDevice[], string, React.Dispatch<React.SetStateAction<string>>] {
  const [config] = api.post.config.useSuspenseQuery();

  // const [, setError] = useAtom(errorAtom);
  const serverSideApiKeyEnabled = config.serverSideApiKeyEnabled;
  const [clientSideLLMCallEnabled] = useAtom(clientSideLLMCallEnabledAtom);

  const [deviceList, setDeviceList] = useState<AudioDevice[]>();
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  const [clientSideApiKey] = useAtom(clientSideApiKeyAtom);
  const [recording] = useAtom<boolean>(recordingAtom);
  const [, setRecognition] = useAtom<SpeechRecognition | null>(recognitionAtom);

  useEffect(() => {
    if (!deviceList) {
      void navigator.mediaDevices.enumerateDevices().then((devices) => {
        const audioInputs = devices
          .filter((device) => device.kind === "audioinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || "マイク (ラベルなし)",
          }));
        setDeviceList(audioInputs);
        if (audioInputs[0] && audioInputs.length > 0) {
          setSelectedDevice(audioInputs[0].deviceId);
        }
      });
    }
  }, []);

  useEffect(
    () => {
      if (!rec) {
        return;
      }
      console.log(`useRecognition useEffect recording: ${recording}`);

      rec.lang = "ja-JP";
      rec.interimResults = true;
      rec.continuous = false; // rec.continuous = true;

      const onResult = (event: SpeechRecognitionEvent) => {
        for (const result of event.results) {
          if (result.isFinal) {
            const recognizedText = result?.[0]?.transcript;
            if (recognizedText) {
              // setTranscripts((prev) => [...prev, recognizedText]);
              void (async () => {
                const sendText = serverSideApiKeyEnabled
                  ? recognizedText
                  : clientSideLLMCallEnabled
                    ? await callLLMFromClient(recognizedText, clientSideApiKey)
                    : recognizedText;
                void onFinalResult?.(sendText);
              })();
            }
          } else {
            if (result?.[0]?.transcript) {
              onIntrimResult?.(result?.[0]?.transcript);
            }
          }
        }
      };
      rec.addEventListener("result", onResult);
      const onStart = (_event: Event) => {
        console.log("Speech start: ", JSON.stringify(recording));
      };
      rec.addEventListener("end", onStart);
      const onEnd = (event: Event) => {
        console.log("Speech onend: ", JSON.stringify(recording));
        if (recording) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          (event.target as any).start(); // 自動再起動
        }
      };
      rec.addEventListener("end", onEnd);

      const onError = (event: SpeechRecognitionErrorEvent) => {
        console.log("Speech onerror:", event.error);
        if (event.error === "no-speech") {
          console.log("no-speech and restart");
          rec.stop();
        }
      };
      rec.addEventListener("error", onError);

      const onSpeechStart = () => {
        console.log("Speech start: ", JSON.stringify(recording));
      };
      rec.addEventListener("speechstart", onSpeechStart);

      const onSpeechEnd = () => {
        console.log("Speech end: ", JSON.stringify(recording));
      };
      rec.addEventListener("speechend", onSpeechEnd);

      setRecognition(rec);

      return () => {
        rec.stop();
        rec.removeEventListener("result", onResult);
        rec.removeEventListener("end", onEnd);
        rec.removeEventListener("error", onError);
        rec.removeEventListener("start", onStart);
        rec.removeEventListener("speechstart", onSpeechStart);
        rec.removeEventListener("speechend", onSpeechEnd);
        setRecognition(null);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recording],
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/non-nullable-type-assertion-style
  return [deviceList as AudioDevice[], selectedDevice, setSelectedDevice];
}
