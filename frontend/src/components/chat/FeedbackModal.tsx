import { useState } from "react";
import { X } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: "like" | "dislike", reason: string) => void;
  type: "like" | "dislike";
}

export function FeedbackModal({ isOpen, onClose, onSubmit, type }: FeedbackModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border p-6 shadow-xl" style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border-default)" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Provide Feedback
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10" style={{ color: "var(--color-text-secondary)" }}>
            <X size={20} />
          </button>
        </div>
        
        <p className="mb-4 text-body" style={{ color: "var(--color-text-secondary)" }}>
          {type === "like" ? "What did you like about this response?" : "What was wrong with this response?"}
        </p>

        <textarea
          className="mb-4 w-full rounded-lg border p-3 text-body focus:outline-none focus:ring-1"
          style={{ 
            backgroundColor: "var(--color-bg-secondary)", 
            borderColor: "var(--color-border-default)", 
            color: "var(--color-text-primary)",
            minHeight: "100px"
          }}
          placeholder="Optional feedback..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          autoFocus
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-white/5"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSubmit(type, reason);
              setReason("");
              onClose();
            }}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--color-accent)", color: "white" }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
