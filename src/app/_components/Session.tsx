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
  selectedSessionAtom,
  serverSideExplicitPassThroughAtom,
} from "~/utils/atoms";
import Transcript from "~/app/_components/Transcript";
import useSharedEditor, { getEditor } from "~/hooks/useSharedEditor";
import useRecognition from "~/hooks/useRecognition";
import SessionSelect from "./SessionSelect";

export default function Session() {
  const [config] = api.post.config.useSuspenseQuery();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const serverSideApiKeyEnabled = config.serverSideApiKeyEnabled;

  // const recording = useRef<boolean>(false);
  // const [, setRecognizeCount] = useState<number>(0);
  // const [recognition, setRecognition] = useState<SpeechRecognition | null>(
  //   null,
  // );
  const [convertedTranscripts, setConvertedTranscripts] = useState<string[]>(
    [],
  );
  const [interimResult, setIntrimResult] = useState<string>("");
  const { mutateAsync: postMessage } = api.session.postMessage.useMutation();
  const utils = api.useUtils();
  const handleFinalResult = (sendText: string) => {
    const callLLM = !!serverSideApiKeyEnabled && !serverSideExplicitPassThrough;
    if (sessionId) {
      void (async () => {
        const result = await postMessage({
          text: sendText,
          callLLM,
          sessionId: sessionId,
        });
        void utils.session.invalidate();
        setConvertedTranscripts((prev) => [...prev, result.text]);
        const editor = getEditor(sessionId);
        editor
          ?.chain()
          .focus("end", { scrollIntoView: true })
          .insertContent(`<li>${result.text}</li>`)
          .run();
      })();
    }
  };
  const handleIntrimResult = (text: string) => {
    setIntrimResult(text);
  };
  const [, ,] = useRecognition(handleFinalResult, handleIntrimResult);

  const [activeTab, setActiveTab] = useState("編集" /*"LLM変換結果"*/);

  const [clientSideApiKey] = useAtom(clientSideApiKeyAtom);
  const [clientSideLLMCallEnabled] = useAtom(clientSideLLMCallEnabledAtom);

  const [serverSideExplicitPassThrough, setServerSideExplicitPassThrough] =
    useAtom(serverSideExplicitPassThroughAtom);

  const [selectedSession, setSelectedSession] = useAtom(selectedSessionAtom);
  const [sessionList] = api.session.list.useSuspenseQuery();
  const sessionId = selectedSession ?? sessionList[0]?.id;

  if (sessionId === undefined) {
    return <div>セッションがありません</div>;
  }

  const handleSessionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSession(event.target.value);
  };

  function llmMode() {
    return clientSideLLMCallEnabled && !!clientSideApiKey
      ? "LLM変換結果(クライアント側でのLLM呼び出し)"
      : serverSideApiKeyEnabled && !serverSideExplicitPassThrough
        ? "LLM変換結果(サーバー側でのLLM呼び出し)"
        : "LLMパススルー";
  }

  return (
    <>
      <SessionSelect
        sessionId={sessionId}
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
        <Transcript />
        <div className="w-1/2 overflow-auto border-l-2 border-gray-200">
          {activeTab === "LLM変換結果" && (
            <ul>
              {convertedTranscripts.map((convertedTranscript, index) => (
                <li key={index}>{convertedTranscript}</li>
              ))}
            </ul>
          )}
          {activeTab === "編集" && (
            <Tiptap key={sessionId} sessionId={sessionId ?? ""} />
          )}
        </div>
      </div>
      <footer className="bg-gray-200 p-4">
        <h2 className="mb-1 mt-1">途中経過:</h2>
        <p>{interimResult}</p>
      </footer>
    </>
  );
}
