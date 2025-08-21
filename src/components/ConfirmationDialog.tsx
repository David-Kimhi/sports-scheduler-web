import { useState } from "react";

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    message,
    onDontShowAgain,
  }: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    onDontShowAgain?: (checked: boolean) => void;
  }) {
    const [dontShow, setDontShow] = useState(false);
  
    if (!open) return null;
  
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        <div className="bg-white rounded-xl shadow-xl p-6 w-80">
          <h2 className="text-lg font-semibold mb-2">{title ?? "Confirm"}</h2>
          <p className="text-sm text-gray-600 mb-4">{message ?? "Are you sure?"}</p>
  
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-4">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="rounded border-gray-300"
            />
            Don’t show this again
          </label>
  
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                if (onDontShowAgain) onDontShowAgain(dontShow);
                onClose();
              }}
              className="px-4 py-2 text-sm rounded-md bg-gray-800 text-white hover:bg-gray-400"
            >
              Yes, clear
            </button>
          </div>
        </div>
      </div>
    );
  }
  