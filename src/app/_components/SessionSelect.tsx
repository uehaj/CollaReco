/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useAtom } from "jotai";
import React from "react";

import { api } from "~/trpc/react";
import { recordingAtom } from "~/utils/atoms";

interface SessionSelectProps {
  sessionId?: string;
  onSessionChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const SessionSelect: React.FC<SessionSelectProps> = ({
  sessionId,
  onSessionChange,
}) => {
  // const [sessionList] = api.session.list.useSuspenseQuery();
  const { data: sessionList } = api.session.list.useQuery();

  const [recording] = useAtom(recordingAtom);

  if (sessionList?.length === 0) {
    return <div>No sessions</div>;
  }

  const defaultValue = sessionId ?? sessionList?.[0]?.id;

  return (
    <label htmlFor="session-select" className="p-2">
      <h4 className="mr-2 mt-0 inline-block">セッション: </h4>
      <select
        disabled={recording}
        className="select select-bordered"
        id="session-select"
        value={defaultValue}
        onChange={onSessionChange}
      >
        {sessionList?.map((session) => (
          <option key={session.id} value={session.id}>
            {session.name}
          </option>
        ))}
      </select>
    </label>
  );
};

export default SessionSelect;
