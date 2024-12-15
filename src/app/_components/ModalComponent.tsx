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
    <dialog open={showModal} className="modal">
      <div className="modal-box w-11/12 max-w-5xl bg-slate-200">
        <form method="dialog">
          {/* if there is a button in form, it will close the modal */}
          <button className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
            ✕
          </button>
        </form>
        <h3 className="text-lg font-bold">API Key</h3>
        <p className="py-4">OpenAI API Key</p>
        <input
          className="max-w-ws input w-full bg-white"
          type="text"
          onChange={handleOnChange}
          defaultValue={clientSideApiKey}
        />
        <div className="modal-action">
          <button
            className="btn btn-outline btn-sm mr-2"
            onClick={handleSaveApiKey}
          >
            Save
          </button>
          <button
            className="btn btn-outline btn-sm mr-2"
            onClick={handleCloseModal}
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default ModalComponent;
