"use client";

import React, { useEffect, useState, useRef } from "react";
// import { callLLM } from "~/utils/llm/llm";
import Tiptap from "./_components/Tiptap";
import useSharedEditor from "~/hooks/useSharedEditor";
import { api } from "~/trpc/react";
// import { callLLM } from "~/util/llm";

interface AudioDevice {
  deviceId: string;
  label: string;
}

const App: React.FC = () => {
  const editor = useSharedEditor();
  // const [recording, setRecording] = useState(false);
  const recording = useRef<boolean>(false);
  useEffect(() => {
    recording.current = false;
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [recognizeCount, setRecognizeCount] = useState<number>(0);

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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const { mutateAsync } = api.post.add.useMutation();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

    rec.onresult = (event: SpeechRecognitionEvent) => {
      for (const result of event.results) {
        if (result.isFinal) {
          const recognizedText = result?.[0]?.transcript;
          console.log(`recognizedText = `, recognizedText);
          if (recognizedText) {
            console.log(
              "認識の最終結果がでました",
              JSON.stringify(recording.current),
            );
            setTranscripts((prev) => [...prev, recognizedText]);
            void (async () => {
              // const convertedText = await callLLM(recognizedText);
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
              const result = await mutateAsync({ text: recognizedText });
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              setConvertedTranscripts((prev) => [...prev, result.text]);
              editor
                ?.chain()
                .focus("end", { scrollIntoView: true })
                .insertContent(`<p>${result.text}</p>`)
                .run();
            })();
          }
        } else {
          if (result?.[0]?.transcript) {
            console.log(
              "認識の中間結果がでました",
              JSON.stringify(recording.current),
            );
            setIntrimResult(result?.[0]?.transcript);
          }
        }
      }
    };

    rec.onend = () => {
      console.log("認識が終了しました。", JSON.stringify(recording.current));
      if (recording.current) {
        console.log("認識を再起動します...", JSON.stringify(recording.current));
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
      rec.stop();
    };
  }, [editor, mutateAsync]);

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
          console.log(
            "音声認識を開始しました。",
            JSON.stringify(recording.current),
          );
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
      console.log(
        "音声認識を区切りました。",
        JSON.stringify(recording.current),
      );
    }
  };
  const handleAbort = () => {
    if (recognition) {
      recognition.abort();
      console.log(
        "音声認識を中止しました。",
        JSON.stringify(recording.current),
      );
      recording.current = false;
      setRecognizeCount((prevValue) => prevValue + 1);
    }
  };
  const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDevice(event.target.value);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* 設定エリア */}
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
          </>
        )}
      </div>

      {/* 認識履歴エリア */}
      <div style={{ flex: "1 1 auto", display: "flex", overflow: "hidden" }}>
        {/* 左側: 認識履歴 */}
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

        {/* 右側: LLM変換結果 */}
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
                  <h2>LLM変換:</h2>
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

      {/* 途中経過エリア */}
      <div style={{ flex: "0 0 auto", padding: "10px" }}>
        <h2>途中経過:</h2>
        <p>{interimResult}</p>
      </div>
    </div>
  );
};

export default App;
