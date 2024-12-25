/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import React, { useEffect, useState, useRef } from "react";
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const serverSideApiKeyEnabled = config.serverSideApiKeyEnabled;
  const [clientSideLLMCallEnabled, setClientSideLLMCallEnabled] = useAtom(
    clientSideLLMCallEnabledAtom,
  );

  const [serverSideExplicitPassThrough, setServerSideExplicitPassThrough] =
    useAtom(serverSideExplicitPassThroughAtom);

  const [deviceList, setDeviceList] = useState<AudioDevice[] | undefined>(
    undefined,
  );
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  const [clientSideApiKey, setClientSideApiKey] = useAtom(clientSideApiKeyAtom);
  const [recording, setRecording] = useAtom<boolean>(recordingAtom);
  const [recognition, setRecognition] = useAtom<SpeechRecognition | null>(
    recognitionAtom,
  );

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
            console.log(`recognizedText = `, recognizedText);
            if (recognizedText) {
              // setTranscripts((prev) => [...prev, recognizedText]);
              void (async () => {
                const sendText = serverSideApiKeyEnabled
                  ? recognizedText
                  : clientSideLLMCallEnabled
                    ? await callLLMFromClient(recognizedText, clientSideApiKey)
                    : recognizedText;
                void onFinalResult?.(sendText);

                // const callLLM =
                //   !!serverSideApiKeyEnabled && !serverSideExplicitPassThrough;

                // if (sessionId) {
                //   const result = await postMessage({
                //     text: sendText,
                //     callLLM,
                //     sessionId: sessionId,
                //   });
                //   void utils.session.invalidate();
                //   setConvertedTranscripts((prev) => [...prev, result.text]);
                //   editor
                //     ?.chain()
                //     .focus("end", { scrollIntoView: true })
                //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                //     .insertContent(`<li>${result.text}</li>`)
                //     .run();
                // }
              })();
            }
          } else {
            if (result?.[0]?.transcript) {
              onIntrimResult?.(result?.[0]?.transcript);
            }
          }
        }
      };
      console.log(`1==== onResult=`, onResult);
      rec.addEventListener("result", onResult);

      rec.onend = () => {
        console.log("Speech onend: ", JSON.stringify(recording));
        if (recording) {
          rec.start(); // 自動再起動
        }
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.log("Speech onerror:", event.error);
        if (event.error === "no-speech") {
          console.log("no-speech and restart");
          rec.stop();
        }
      };

      rec.onspeechstart = () => {
        console.log("Speech start: ", JSON.stringify(recording));
      };

      rec.onspeechend = () => {
        console.log("Speech end: ", JSON.stringify(recording));
      };

      setRecognition(rec);
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

      return () => {
        rec.stop();
        rec.removeEventListener("result", onResult);
        setRecognition(null);
      };
    },
    [
      // serverSideApiKeyEnabled,
      // clientSideLLMCallEnabled,
      // serverSideExplicitPassThrough,
      // setError,
      // onFinalResult,
      // onIntrimResult,
      // setRecognition,
      // clientSideApiKey,
      // recording,
    ],
  );

  return [deviceList, selectedDevice, setSelectedDevice];
}
