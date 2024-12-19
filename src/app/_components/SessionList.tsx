import React from "react";

interface SessionListProps {
  sessionList: string[];
  selectedSession: string;
  onSessionChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const SessionList: React.FC<SessionListProps> = ({
  sessionList,
  selectedSession,
  onSessionChange,
}) => {
  return (
    <div>
      <span className="label">
        <label htmlFor="session-select" className="label-text">
          <h3 className="mr-2 mt-0 inline-block">セッション: </h3>
          <select
            className="select select-bordered"
            id="session-select"
            value={selectedSession}
            onChange={onSessionChange}
          >
            {sessionList.map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>
        </label>
      </span>
    </div>
  );
};

export default SessionList;
