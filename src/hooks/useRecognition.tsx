/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Tiptap from "~/app/_components/Tiptap";
import { api } from "~/trpc/react";
import { useAtom } from "jotai";
import {
  clientSideApiKeyAtom,
  clientSideLLMCallEnabledAtom,
  errorAtom,
  recognitionAtom,
  recordingAtom,
  serverSideExplicitPassThroughAtom,
} from "~/utils/atoms";

import Transcript from "~/app/_components/Transcript";
import useSharedEditor from "~/hooks/useSharedEditor";
import { callLLMFromClient } from "~/utils/llm/llmFromClient";

interface AudioDevice {
  deviceId: string;
  label: string;
}

export default function useRecognition(
  onFinalResult?: (text: string) => void,
  onIntrimResult?: (text: string) => void,
): [AudioDevice[], string, React.Dispatch<React.SetStateAction<string>>] {
  const [config] = api.post.config.useSuspenseQuery();

  const [, setError] = useAtom(errorAtom);
  const serverSideApiKeyEnabled = config.serverSideApiKeyEnabled;
  const [clientSideLLMCallEnabled] = useAtom(clientSideLLMCallEnabledAtom);

  // const [serverSideExplicitPassThrough, setServerSideExplicitPassThrough] =
  //   useAtom(serverSideExplicitPassThroughAtom);

  const [deviceList, setDeviceList] = useState<AudioDevice[] | undefined>();
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  const [clientSideApiKey] = useAtom(clientSideApiKeyAtom);
  const [recording] = useAtom<boolean>(recordingAtom);
  const [, setRecognition] = useAtom<SpeechRecognition | null>(recognitionAtom);

  useEffect(() => {
    console.log(`useEffect`);
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
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError("このブラウザは音声認識APIをサポートしていません。");
        return;
      }

      const rec = new SpeechRecognition();
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
      const onStart = (event: Event) => {
        console.log("Speech start: ", JSON.stringify(recording));
      };
      rec.addEventListener("end", onStart);
      const onEnd = (event: Event) => {
        console.log("Speech onend: ", JSON.stringify(recording));
        if (recording) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // if (!deviceList) {
      //   void navigator.mediaDevices.enumerateDevices().then((devices) => {
      //     const audioInputs = devices
      //       .filter((device) => device.kind === "audioinput")
      //       .map((device) => ({
      //         deviceId: device.deviceId,
      //         label: device.label || "マイク (ラベルなし)",
      //       }));
      //     setDeviceList(audioInputs);
      //     if (audioInputs[0] && audioInputs.length > 0) {
      //       setSelectedDevice(audioInputs[0].deviceId);
      //     }
      //   });
      // }

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

  return [deviceList, selectedDevice, setSelectedDevice];
}
