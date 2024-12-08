"use client";

import { useAtom } from "jotai";
import React from "react";
import { clientSideApiKeyAtom, showModalAtom } from "~/utils/atoms";

const ModalComponent = () => {
  const [clientSideApiKey, setClientSideApiKey] = useAtom(clientSideApiKeyAtom);
  const [tmpApiKey, setTmpApiKey] = React.useState(clientSideApiKey);
  const [showModal, setShowModal] = useAtom(showModalAtom);

  if (!showModal) return null;

  function handleSaveApiKey(event: React.MouseEvent<HTMLButtonElement>): void {
    setClientSideApiKey(tmpApiKey);
    setShowModal(false);
  }

  function handleCloseModal(event: React.MouseEvent<HTMLButtonElement>): void {
    setShowModal(false);
  }

  function handleOnChange(event: React.ChangeEvent<HTMLInputElement>): void {
    setTmpApiKey(event.target.value);
  }

  return (
    <dialog open={showModal}>
      <div className="modal-content">
        <h2>API Key</h2>
        <input
          type="text"
          onChange={handleOnChange}
          defaultValue={clientSideApiKey}
        />
        <button onClick={handleSaveApiKey}>Save</button>
        <button onClick={handleCloseModal}>Close</button>
      </div>
    </dialog>
  );
};

export default ModalComponent;
