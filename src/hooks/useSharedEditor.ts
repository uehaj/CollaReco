"use client";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { env } from "~/env";

// import BulletList from "@tiptap/extension-bullet-list";
// import Document from "@tiptap/extension-document";
// import ListItem from "@tiptap/extension-list-item";
// import Paragraph from "@tiptap/extension-paragraph";
// import Text from "@tiptap/extension-text";
// import OrderedList from "@tiptap/extension-ordered-list";

// 動的にホスト名からWebSocket URLを生成
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//const { publicRuntimeConfig } = getConfig(); // Get publicRuntimeConfig from next/config
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
//const websocketUrl = publicRuntimeConfig.NEXT_PUBLIC_WEBSOCKET_URL; // Use publicRuntimeConfig

const ydoc = new Y.Doc(); // Initialize Y.Doc for shared editing
const websocketUrl: string = env.NEXT_PUBLIC_WEBSOCKET_URL ?? "ws://localhost:1234";
if (websocketUrl !== 'http://no_websocket') {
  const websocketProvider = new WebsocketProvider(
    websocketUrl,
    "CollaReco-demo",
    ydoc,
  );
  websocketProvider.on("status", (event: { status: string }) => {
    console.log(event.status); // logs "connected" or "disconnected"
  });
}

export default function useSharedEditor() {
  const editor = useEditor({
    // TODO: uset sthema and setup for List edit
    // https://tiptap.dev/docs/editor/extensions/nodes/list-item
    extensions: [
      Collaboration.configure({
        document: ydoc, // Configure Y.Doc for collaboration
      }),
      StarterKit,
    ],
    immediatelyRender: false,
    autofocus: "end",
    content: `
<h4>start recognition</h4>
  `,
  });

  return editor;
}