"use client";

import React, { useEffect, useState, useRef } from "react";
import Tiptap from "./_components/Tiptap";
import useSharedEditor from "~/hooks/useSharedEditor";
import { api } from "~/trpc/react";
import ModalComponent from "./_components/ModalComponent";
import { useAtom } from "jotai";
import {
  clientSideApiKeyAtom,
  showModalAtom,
  clientSideLLMCallEnabledAtom,
} from "~/utils/atoms";
import { callLLMFromClient } from "~/utils/llm/llmFromClient";

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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("LLM変換結果");
  const { mutateAsync: addPost } = api.post.add.useMutation();

  const [clientSideApiKey] = useAtom(clientSideApiKeyAtom);
  const [clientSideLLMCallEnabled, setClientSideLLMCallEnabled] = useAtom(
    clientSideLLMCallEnabledAtom,
  );

  const output = api.post.config.useQuery();
  const serverSideApiKeyEnabled = output.data?.serverSideApiKeyEnabled;
  const [, setShowModal] = useAtom(showModalAtom);

  const [serverSideExplicitPassThrough, setServerSideExplicitPassThrough] =
    useState(false);

  useEffect(() => {
    recording.current = false;
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("このブラウザは音声認識APIをサポートしていません。");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "ja-JP";
    rec.interimResults = false;
    rec.continuous = false;
    //rec.continuous = true;
    console.log(`======================`);
    console.log(`1====clientSideLLMCallEnabled=`, clientSideLLMCallEnabled);
    const onResult = (event: SpeechRecognitionEvent) => {
      for (const result of event.results) {
        if (result.isFinal) {
          const recognizedText = result?.[0]?.transcript;
          if (recognizedText) {
            setTranscripts((prev) => [...prev, recognizedText]);
            void (async () => {
              console.log(
                `====serverSideApiKeyEnabled=`,
                serverSideApiKeyEnabled,
              );
              console.log(
                `2====clientSideLLMCallEnabled=`,
                clientSideLLMCallEnabled,
              );

              const sendText = serverSideApiKeyEnabled
                ? recognizedText
                : clientSideLLMCallEnabled
                  ? await callLLMFromClient(recognizedText, clientSideApiKey)
                  : recognizedText;
              const result = await addPost({
                text: sendText,
                callLLM:
                  !!serverSideApiKeyEnabled && !serverSideExplicitPassThrough,
              });
              console.log(`====sendText=`, sendText);
              console.log(`====result.text=`, result.text);
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div
        style={{
          flex: "0 0 auto",
          padding: "10px",
          borderBottom: "1px solid #ccc",
        }}
      >
        <h1>CollaReco(Collaborative Speech Recognition Tool)</h1>
        {error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <>
            <div>
              <label htmlFor="device-select">音声入力デバイス:</label>
              <select
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
            </div>
            <>
              {recording.current ? (
                <span style={{ color: "red" }}>●</span>
              ) : (
                <span>■</span>
              )}
            </>
            <button
              onClick={handleStart}
              disabled={recording.current}
              style={{ margin: "10px" }}
            >
              音声認識を開始
            </button>
            <button
              onClick={handleAbort}
              disabled={!recording.current}
              style={{ margin: "10px" }}
            >
              音声認識を中止
            </button>
            <button
              onClick={handleStop}
              disabled={!recording.current}
              style={{ margin: "10px" }}
            >
              音声認識を区切る
            </button>
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
                    onClick={() => setShowModal(true)}
                    disabled={recording.current}
                  >
                    ✎ Set API Key
                  </button>
                )}
              </span>
            )}
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
          </>
        )}
      </div>
      <div style={{ flex: "1 1 auto", display: "flex", overflow: "hidden" }}>
        <div
          style={{
            flex: "1 1 50%",
            overflowY: "auto",
            padding: "10px",
            borderRight: "1px solid #ccc",
          }}
          ref={scrollRef}
        >
          <h2>認識履歴:</h2>
          <ul>
            {transcripts.map((transcript, index) => (
              <li key={index}>{transcript}</li>
            ))}
          </ul>
        </div>
        <div
          style={{
            flex: "1 1 50%",
            overflowY: "auto",
            padding: "10px",
            backgroundColor: activeTab === "編集" ? "#ffefef" : "white",
          }}
        >
          <div>
            <div className="tabs">
              <button
                onClick={() => setActiveTab("LLM変換結果")}
                disabled={activeTab === "LLM変換結果"}
              >
                LLM変換結果
              </button>
              <button
                onClick={() => setActiveTab("編集")}
                disabled={activeTab === "編集"}
              >
                共同編集
              </button>
            </div>
            <div className="tab-content">
              {activeTab === "LLM変換結果" && (
                <div>
                  <h2>
                    {clientSideLLMCallEnabled && !!clientSideApiKey
                      ? "LLM変換結果(クライアント側でのLLM呼び出し)"
                      : serverSideApiKeyEnabled &&
                          !serverSideExplicitPassThrough
                        ? "LLM変換結果(サーバー側でのLLM呼び出し)"
                        : "LLMパススルー"}
                    :
                  </h2>
                  <ul>
                    {convertedTranscripts.map((convertedTranscript, index) => (
                      <li key={index}>{convertedTranscript}</li>
                    ))}
                  </ul>
                </div>
              )}
              {activeTab === "編集" && (
                <div>
                  <h2>編集:</h2>
                  <Tiptap editor={editor} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{ flex: "0 0 auto", padding: "10px" }}>
        <h2>途中経過:</h2>
        <p>{interimResult}</p>
      </div>
      {!serverSideApiKeyEnabled && <ModalComponent />}
    </div>
  );
};

export default App;
