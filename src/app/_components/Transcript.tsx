/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { api } from "~/trpc/react";
import { useAtom } from "jotai";
import { selectedSessionAtom } from "~/utils/atoms";
import { useEffect, useRef } from "react";

export default function Transcript() {
  const [selectedSession] = useAtom(selectedSessionAtom);
  const [messages] = api.session.listMessages.useSuspenseQuery({
    sessionId: selectedSession ?? "",
  });
  // const scrollRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   if (scrollRef.current) {
  //     scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  //   }
  // }, [messages]);

  return (
    <div className="w-1/2 overflow-auto">
      <ul>
        {messages?.map((message, index) => <li key={index}>{message.text}</li>)}
      </ul>
    </div>
  );
}
