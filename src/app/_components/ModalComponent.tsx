import React, { useState } from "react";

type Props = {
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
};
const ModalComponent = ({ showModal, setShowModal }: Props) => {
  const [apiKeyClientSide, setApiKeyClientSide] = useState<string | undefined>(
    undefined,
  );

  if (!showModal) return null;

  function handleSaveApiKey(event: React.MouseEvent<HTMLButtonElement>): void {
    setShowModal(false);
  }

  function handleCloseModal(event: React.MouseEvent<HTMLButtonElement>): void {
    setShowModal(false);
  }

  return (
    <dialog open={showModal}>
      <div className="modal-content">
        <h2>API Key</h2>
        <input
          type="text"
          value={apiKeyClientSide}
          onChange={(e) => setApiKeyClientSide?.(e.target.value)}
        />
        <button onClick={handleSaveApiKey}>Save</button>
        <button onClick={handleCloseModal}>Close</button>
      </div>
    </dialog>
  );
};

export default ModalComponent;
