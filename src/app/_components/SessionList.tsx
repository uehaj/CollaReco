/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from "react";

import { api } from "~/trpc/react";

interface SessionListProps {
  selectedSession?: string;
  onSessionChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const SessionList: React.FC<SessionListProps> = ({
  selectedSession,
  onSessionChange,
}) => {
  const [sessionList] = api.session.list.useSuspenseQuery();

  if (sessionList.length === 0) {
    return <div>No sessions</div>;
  }

  const defaultValue = selectedSession ?? sessionList[0]?.id;

  return (
    <label htmlFor="session-select" className="p-2">
      <h4 className="mr-2 mt-0 inline-block">セッション: </h4>
      <select
        className="select select-bordered"
        id="session-select"
        value={defaultValue}
        onChange={onSessionChange}
      >
        {sessionList.map((session) => (
          <option key={session.id} value={session.id}>
            {session.name}
          </option>
        ))}
      </select>
    </label>
  );
};

export default SessionList;
