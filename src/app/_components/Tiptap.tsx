"use client";

import React from "react";
//import type { Editor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";
import useSharedEditor from "~/hooks/useSharedEditor";

type Props = {
  sessionId: string;
};

const Tiptap = ({ sessionId }: Props) => {
  const editor = useSharedEditor(sessionId ?? "");
  return (
    <EditorContent key="sessionId" id="sessionId" editor={editor ?? null} />
  );
};

export default Tiptap;
