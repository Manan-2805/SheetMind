import { useState } from "react";
import { X, RefreshCw } from "lucide-react";

interface RegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, instruction: string) => void;
}

const REASONS = [
  "SQL error",
  "Incorrect data",
  "Missed context",
  "Formatting issue",
  "Other"
];

export function RegenerateModal({ isOpen, onClose, onSubmit }: RegenerateModalProps) {
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [instruction, setInstruction] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border p-6 shadow-xl" style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border-default)" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Regenerate Response
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10" style={{ color: "var(--color-text-secondary)" }}>
            <X size={20} />
          </button>
        </div>
        
        <p className="mb-4 text-body" style={{ color: "var(--color-text-secondary)" }}>
          Why do you want to regenerate this response?
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {REASONS.map(r => (
            <button
              key={r}
              onClick={() => setSelectedReason(r)}
              className={`rounded-full px-3 py-1 text-xs font-medium border ${selectedReason === r ? 'border-transparent' : ''}`}
              style={{ 
                backgroundColor: selectedReason === r ? "var(--color-accent)" : "transparent",
                borderColor: selectedReason === r ? "transparent" : "var(--color-border-default)",
                color: selectedReason === r ? "white" : "var(--color-text-secondary)"
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <p className="mb-2 text-ui-label font-medium" style={{ color: "var(--color-text-primary)" }}>
          Additional Instructions (Optional)
        </p>
        <textarea
          className="mb-6 w-full rounded-lg border p-3 text-body focus:outline-none focus:ring-1"
          style={{ 
            backgroundColor: "var(--color-bg-secondary)", 
            borderColor: "var(--color-border-default)", 
            color: "var(--color-text-primary)",
            minHeight: "80px"
          }}
          placeholder="E.g., Please include the date column in the query."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
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
              onSubmit(selectedReason, instruction);
              setInstruction("");
              setSelectedReason(REASONS[0]);
              onClose();
            }}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--color-accent)", color: "white" }}
          >
            <RefreshCw size={14} />
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
