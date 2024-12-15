"use client";

import React from "react";
import type { Editor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";

type Props = {
  editor: Editor | null;
};
const Tiptap = ({ editor }: Props) => {
  return <EditorContent editor={editor} />;
};

export default Tiptap;
