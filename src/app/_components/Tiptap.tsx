"use client";

import React, { MouseEventHandler } from "react";
import { type EditorOptions, Editor } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

import BulletList from "@tiptap/extension-bullet-list";
import Document from "@tiptap/extension-document";
import ListItem from "@tiptap/extension-list-item";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import OrderedList from "@tiptap/extension-ordered-list";
import { twMerge } from "tailwind-merge";

// define your extension array
// const extensions = [StarterKit];
// const content = "<p>Hello World!</p>";
type Props = {
  editor: Editor | null;
};
const Tiptap = ({ editor }: Props) => {
  const handleClick: MouseEventHandler<HTMLButtonElement> = () => {
    editor?.commands.focus("end", { scrollIntoView: true });
    editor?.commands.insertContent("<br/>hoge");
  };

  return (
    <>
      {/* <button className="btn" onClick={handleClick}>
        Aciton
      </button>
      <div className="control-group">
        <div className="button-group">
          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`atcive:btn-active btn-primary`}
          >
            Toggle bullet list
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={editor?.isActive("orderedList") ? "is-active" : ""}
          >
            Toggle ordered list
          </button>
          <button
            onClick={() =>
              editor?.chain().focus().splitListItem("listItem").run()
            }
            disabled={!editor?.can().splitListItem("listItem")}
          >
            Split list item
          </button>
          <button
            onClick={() =>
              editor?.chain().focus().sinkListItem("listItem").run()
            }
            disabled={!editor?.can().sinkListItem("listItem")}
          >
            Sink list item
          </button>
          <button
            onClick={() =>
              editor?.chain().focus().liftListItem("listItem").run()
            }
            disabled={!editor?.can().liftListItem("listItem")}
          >
            Lift list item
          </button>
        </div>
      </div> */}
      <div className="m-4 border-2 p-2 shadow-lg">
        <EditorContent editor={editor} />
      </div>
    </>
  );
};

export default Tiptap;
