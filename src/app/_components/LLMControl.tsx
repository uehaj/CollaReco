import {
  clientSideLLMCallEnabledAtom,
  recordingAtom,
  serverSideExplicitPassThroughAtom,
} from "~/utils/atoms";
import ModalComponent from "./ModalComponent";
import { api } from "~/trpc/react";
import { useAtom } from "jotai";
import { useRef } from "react";

export default function LLMControl() {
  const [recording] = useAtom<boolean>(recordingAtom);
  const [clientSideLLMCallEnabled, setClientSideLLMCallEnabled] = useAtom(
    clientSideLLMCallEnabledAtom,
  );

  const [config] = api.post.config.useSuspenseQuery();
  // const { data: config } = api.post.config.useQuery();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const serverSideApiKeyEnabled = config?.serverSideApiKeyEnabled;

  const [serverSideExplicitPassThrough, setServerSideExplicitPassThrough] =
    useAtom(serverSideExplicitPassThroughAtom);

  const handleLLMCallEnabledChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setClientSideLLMCallEnabled(event.target.checked);
  };

  const handleServerSideExplicitPassThroughChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setServerSideExplicitPassThrough(event.target.checked);
  };

  const dialogRef = useRef<HTMLDialogElement | null>(null);

  function handleShowDaialog() {
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }
  }

  return (
    <>
      {!serverSideApiKeyEnabled && (
        <span>
          <label>
            <input
              type="checkbox"
              checked={clientSideLLMCallEnabled}
              onChange={handleLLMCallEnabledChange}
              disabled={recording}
            />
            クライアント側からのLLM呼び出し
          </label>
          {clientSideLLMCallEnabled && (
            <button onClick={handleShowDaialog} disabled={recording}>
              ✎ Set API Key
            </button>
          )}
        </span>
      )}

      {serverSideApiKeyEnabled && (
        <span>
          <label>
            <input
              type="checkbox"
              checked={serverSideExplicitPassThrough}
              onChange={handleServerSideExplicitPassThroughChange}
              disabled={recording}
            />
            LLMパススルー
          </label>
        </span>
      )}
      {!serverSideApiKeyEnabled && <ModalComponent ref={dialogRef} />}
    </>
  );
}
