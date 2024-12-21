/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from "react";

import { api } from "~/trpc/react";

interface SessionListProps {
  selectedSession?: number;
  onSessionChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const SessionList: React.FC<SessionListProps> = ({
  selectedSession,
  onSessionChange,
}) => {
  const [sessionList] = api.session.list.useSuspenseQuery();

  const defaultValue =
    sessionList.length === 0
      ? "No sessions"
      : selectedSession
        ? sessionList?.[selectedSession]?.name
        : "Select a session";

  return (
    <label htmlFor="session-select" className="p-2">
      <h3 className="mr-2 mt-0 inline-block">セッション: </h3>
      <select
        className="select select-bordered"
        id="session-select"
        value={defaultValue}
        onChange={onSessionChange}
      >
        {sessionList.map((session) => (
          <option key={session.id} value={session.name}>
            {session.name}
          </option>
        ))}
      </select>
    </label>
  );
};

export default SessionList;
