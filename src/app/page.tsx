"use client";

import React, { useEffect, useState, useRef, RefObject } from "react";
import Tiptap from "~/app/_components/Tiptap";
import useSharedEditor from "~/hooks/useSharedEditor";
import { api } from "~/trpc/react";
import ModalComponent from "~/app/_components/ModalComponent";
import { useAtom } from "jotai";
import {
  clientSideApiKeyAtom,
  clientSideLLMCallEnabledAtom,
} from "~/utils/atoms";
import { callLLMFromClient } from "~/utils/llm/llmFromClient";
import SessionList from "~/app/_components/SessionList";

interface AudioDevice {
  deviceId: string;
  label: string;
}

const App: React.FC = () => {
  const editor = useSharedEditor();
  const recording = useRef<boolean>(false);
  const [, setRecognizeCount] = useState<number>(0);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null,
  );
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [convertedTranscripts, setConvertedTranscripts] = useState<string[]>(
    [],
  );
  const [interimResult, setIntrimResult] = useState<string>("");
  const [deviceList, setDeviceList] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | undefined>(
    undefined,
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("編集" /*"LLM変換結果"*/);
  const { mutateAsync: addPost } = api.post.add.useMutation();
  const { mutateAsync: addPostToSession } =
    api.session.postMessage.useMutation();

  const [clientSideApiKey] = useAtom(clientSideApiKeyAtom);
  const [clientSideLLMCallEnabled, setClientSideLLMCallEnabled] = useAtom(
    clientSideLLMCallEnabledAtom,
  );

  const output = api.post.config.useQuery();
  const serverSideApiKeyEnabled = output.data?.serverSideApiKeyEnabled;

  const [serverSideExplicitPassThrough, setServerSideExplicitPassThrough] =
    useState(false);

  useEffect(() => {
    recording.current = false;
  }, []);

  const [sessionList] = api.session.list.useSuspenseQuery();

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("このブラウザは音声認識APIをサポートしていません。");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "ja-JP";
    rec.interimResults = true;
    rec.continuous = false;
    // rec.continuous = true;
    console.log(`1====clientSideLLMCallEnabled=`, clientSideLLMCallEnabled);
    const onResult = (event: SpeechRecognitionEvent) => {
      for (const result of event.results) {
        if (result.isFinal) {
          const recognizedText = result?.[0]?.transcript;
          console.log(`recognizedText = `, recognizedText);
          if (recognizedText) {
            setTranscripts((prev) => [...prev, recognizedText]);
            void (async () => {
              const sendText = serverSideApiKeyEnabled
                ? recognizedText
                : clientSideLLMCallEnabled
                  ? await callLLMFromClient(recognizedText, clientSideApiKey)
                  : recognizedText;
              const callLLM =
                !!serverSideApiKeyEnabled && !serverSideExplicitPassThrough;
              const result = await addPost({
                text: sendText,
                callLLM,
              });
              const sessionId = sessionList[0]?.id ?? "xxx";
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const result2 = await addPostToSession({
                text: sendText,
                callLLM,
                sessionId,
                userId: "1",
              });
              console.log(`====sendText=`, sendText);
              console.log(`====result.text=`, result2);
              setConvertedTranscripts((prev) => [...prev, result.text]);
              editor
                ?.chain()
                .focus("end", { scrollIntoView: true })
                .insertContent(`<li>${result.text}</li>`)
                .run();
            })();
          }
        } else {
          if (result?.[0]?.transcript) {
            setIntrimResult(result?.[0]?.transcript);
          }
        }
      }
    };
    console.log(`1==== onResult=`, onResult);
    rec.addEventListener("result", onResult);

    rec.onend = () => {
      if (recording.current) {
        rec.start(); // 自動再起動
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log("認識エラー:", event.error);
      if (event.error === "no-speech") {
        console.log("no-speech and restart");
        rec.stop();
      }
    };

    rec.onspeechstart = () => {
      console.log("Speech detected", JSON.stringify(recording.current));
    };

    rec.onspeechend = () => {
      console.log("Speech detection ended", JSON.stringify(recording.current));
    };
    console.log(`setRecognition`, rec);
    setRecognition(rec);

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

    return () => {
      console.log(`------------------- rec.stop()`);
      rec.stop();
      rec.removeEventListener("result", onResult);
      setRecognition(null);
    };
  }, [
    editor,
    addPost,
    serverSideApiKeyEnabled,
    clientSideLLMCallEnabled,
    clientSideApiKey,
    serverSideExplicitPassThrough,
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const dialogRef = useRef<HTMLDialogElement | null>(null);

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
          recording.current = true;
          setRecognizeCount((prevValue) => prevValue + 1);
        })
        .catch((err) => {
          console.error("マイクへのアクセスに失敗しました。", err);
          recording.current = false;
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
      recording.current = false;
      setRecognizeCount((prevValue) => prevValue + 1);
    }
  };

  const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDevice(event.target.value);
  };

  const handleSessionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(`event.target.value=`, event.target.value);
    setSelectedSession(event.target.selectedIndex);
  };

  const handleLLMCallEnabledChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setClientSideLLMCallEnabled(event.target.checked);
  };

  const handleServerSideExplicitPassThroughChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setServerSideExplicitPassThrough(event.target.checked);
  };

  function llmMode() {
    return clientSideLLMCallEnabled && !!clientSideApiKey
      ? "LLM変換結果(クライアント側でのLLM呼び出し)"
      : serverSideApiKeyEnabled && !serverSideExplicitPassThrough
        ? "LLM変換結果(サーバー側でのLLM呼び出し)"
        : "LLMパススルー";
  }

  function handleShowDaialog() {
    console.log(`dialogRef.current`, dialogRef.current);
    if (dialogRef.current) {
      console.log(`handleShowDaialog`);
      dialogRef.current.showModal();
    }
  }

  return (
    <div className="prose prose-slate flex h-screen max-w-none flex-col">
      <header className="bg-gray-200 p-4">
        <div>
          <div className="flex items-baseline justify-start">
            <span className="relative">
              <span
                className="text-shadow absolute left-0.5 top-0.5 text-4xl font-bold italic text-white"
                style={{ textShadow: "2px 2px 3px rgba(0, 0, 0, 0.1);" }}
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
                    {deviceList.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </label>
              </span>
            </div>
            <div className="mb-2">
              {recording.current ? (
                <span className="p-4 text-red-700">●</span>
              ) : (
                <span className="p-4">■</span>
              )}
              <button
                className="btn btn-outline btn-sm mr-2"
                onClick={handleStart}
                disabled={recording.current}
              >
                音声認識を開始
              </button>
              <button
                className="btn btn-outline btn-sm mr-2"
                onClick={handleAbort}
                disabled={!recording.current}
              >
                音声認識を中止
              </button>
              <button
                className="btn btn-outline btn-sm mr-2"
                onClick={handleStop}
                disabled={!recording.current}
              >
                音声認識を区切る
              </button>

              <>
                {!serverSideApiKeyEnabled && (
                  <span>
                    <label>
                      <input
                        type="checkbox"
                        checked={clientSideLLMCallEnabled}
                        onChange={handleLLMCallEnabledChange}
                        disabled={recording.current}
                      />
                      クライアント側からのLLM呼び出し
                    </label>
                    {clientSideLLMCallEnabled && (
                      <button
                        onClick={handleShowDaialog}
                        disabled={recording.current}
                      >
                        ✎ Set API Key
                      </button>
                    )}
                  </span>
                )}
              </>
              {serverSideApiKeyEnabled && (
                <span>
                  <label>
                    <input
                      type="checkbox"
                      checked={serverSideExplicitPassThrough}
                      onChange={handleServerSideExplicitPassThroughChange}
                      disabled={recording.current}
                    />
                    LLMパススルー
                  </label>
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <SessionList
        selectedSession={selectedSession}
        onSessionChange={handleSessionChange}
      />

      <div className="flex w-full">
        <div className="ml-4 flex w-1/2 justify-center align-bottom">
          <div className="font-bold">認識履歴(Web Speech Recognition API)</div>
        </div>
        <div className="mr-4 flex w-1/2 space-x-2 border-l-2 border-gray-200 p-2">
          <button
            className={`${activeTab === "LLM変換結果" ? "border-2 border-teal-500" : "border-transparent"} btn w-1/2`}
            onClick={() => setActiveTab("LLM変換結果")}
          >
            {llmMode()}
          </button>
          <button
            className={`${activeTab === "編集" ? "border-2 border-teal-500" : "border-transparent hover:border-gray-200"} btn w-1/2`}
            onClick={() => setActiveTab("編集")}
          >
            編集
          </button>
        </div>
      </div>
      <div className="flex flex-col"></div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 overflow-auto">
          <ul>
            {transcripts.map((transcript, index) => (
              <li key={index}>{transcript}</li>
            ))}
          </ul>
        </div>

        <div className="w-1/2 overflow-auto border-l-2 border-gray-200">
          {activeTab === "LLM変換結果" && (
            <ul>
              {convertedTranscripts.map((convertedTranscript, index) => (
                <li key={index}>{convertedTranscript}</li>
              ))}
            </ul>
          )}
          {activeTab === "編集" && <Tiptap editor={editor} />}
        </div>
      </div>
      <footer className="bg-gray-200 p-4">
        <h2 className="mb-1 mt-1">途中経過:</h2>
        <p>{interimResult}</p>
      </footer>
      {!serverSideApiKeyEnabled && <ModalComponent ref={dialogRef} />}
    </div>
  );
};

export default App;
