"use client";

import React, { useState, Suspense } from "react";
import { useAtom } from "jotai";
import { errorAtom, recognitionAtom, recordingAtom } from "~/utils/atoms";
import Session from "./_components/Session";
import useRecognition from "~/hooks/useRecognition";
import LLMControl from "./_components/LLMControl";
import { SuspenseWithoutSsr } from "./_components/SuspenseWithoutSsr";

const App: React.FC = () => {
  const [recording, setRecording] = useAtom<boolean>(recordingAtom);
  const [recognition] = useAtom<SpeechRecognition | null>(recognitionAtom);
  const [, setRecognizeCount] = useState<number>(0);

  const [error] = useAtom(errorAtom);

  const [deviceList, selectedDevice, setSelectedDevice] = useRecognition();

  const handleStart = () => {
    if (recognition) {
      navigator.mediaDevices
        .getUserMedia({
          audio: {
            deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          },
        })
        .then(() => {
          recognition.start();
          console.log(`1 -> true`);
          setRecording(true);
          setRecognizeCount((prevValue) => prevValue + 1);
        })
        .catch((err) => {
          console.error("マイクへのアクセスに失敗しました。", err);
          console.log(`2 -> false`);
          setRecording(false);
        });
    }
  };

  const handleStop = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  const handleAbort = () => {
    if (recognition) {
      recognition.abort();
      console.log(`3 -> false`);
      setRecording(false);
      setRecognizeCount((prevValue) => prevValue + 1);
    }
  };

  const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDevice(event.target.value);
  };

  return (
    <div className="prose prose-slate flex h-screen max-w-none flex-col">
      <header className="bg-gray-200 p-4">
        <div>
          <div className="flex items-baseline justify-start">
            <span className="relative">
              <span
                className="text-shadow absolute left-0.5 top-0.5 text-4xl font-bold italic text-white"
                style={{ textShadow: "2px 2px 3px rgba(0, 0, 0, 0.1)" }}
              >
                CollaReco
              </span>
              <span className="relative text-4xl font-bold italic text-blue-900">
                CollaReco
              </span>
            </span>
            {/* <h1 className="mb-1 italic text-slate-800 shadow-lg">CollaReco</h1> */}
            <span className="ml-4 text-lg text-slate-500">
              Collaborative Speech Recognition Tool
            </span>
          </div>
          {error && <p className="text-red-700">{error}</p>}
          <div className="rounded-lg bg-slate-300 p-2">
            <div>
              <span className="label">
                <label htmlFor="device-select" className="label-text">
                  <h3 className="mr-2 mt-0 inline-block">音声入力デバイス: </h3>
                  <select
                    className="select select-bordered"
                    id="device-select"
                    value={selectedDevice}
                    onChange={handleDeviceChange}
                  >
                    {deviceList?.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </label>
              </span>
            </div>
            <div className="mb-2">
              {recording ? (
                <span className="p-4 text-red-700">●</span>
              ) : (
                <span className="p-4">■</span>
              )}
              <button
                className="btn btn-outline btn-sm mr-2"
                onClick={handleStart}
                disabled={recording}
              >
                音声認識を開始
              </button>
              <button
                className="btn btn-outline btn-sm mr-2"
                onClick={handleAbort}
                disabled={!recording}
              >
                音声認識を中止
              </button>
              <button
                className="btn btn-outline btn-sm mr-2"
                onClick={handleStop}
                disabled={!recording}
              >
                音声認識を区切る
              </button>
              <Suspense fallback={<div>Loading...</div>}>
                <LLMControl />
              </Suspense>
            </div>
          </div>
        </div>
      </header>
      <SuspenseWithoutSsr fallback={<div>Loading...</div>}>
        <Session />
      </SuspenseWithoutSsr>
    </div>
  );
};

export default App;
