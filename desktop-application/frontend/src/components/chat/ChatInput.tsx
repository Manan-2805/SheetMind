import { Hash, Send, Square } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { useFileAutocomplete } from "@/hooks/useFileAutocomplete";
import { extractReferencedFiles } from "@/utils/chatReferences";
import { FileAutocomplete } from "./FileAutocomplete";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content: string, referencedFiles: string[]) => void;
  isLoading: boolean;
  onStop?: () => void;
  placeholder?: string;
  followups?: string[];
  onFollowupClick?: (text: string) => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
  onStop,
  placeholder = "Ask anything about your data...",
  followups = [],
  onFollowupClick,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    showAutocomplete,
    autocompleteQuery,
    triggerIndex,
    files,
    detectTrigger,
    dismiss: dismissAutocomplete,
  } = useFileAutocomplete();

  const MIN_HEIGHT = 44;
  const MAX_HEIGHT = 160;

  const referencedFiles = useMemo(() => extractReferencedFiles(value, files), [value, files]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(Math.max(ta.scrollHeight, MIN_HEIGHT), MAX_HEIGHT)}px`;
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    detectTrigger(e.target.value, e.target.selectionStart ?? 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showAutocomplete && ["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) {
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isLoading) return;
      if (!value.trim()) return;
      if (value.length > 2000) return;
      onSend(value.trim(), referencedFiles);
    }
  };

  const handleHashButtonClick = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart ?? value.length;
    const next = value.slice(0, pos) + "#" + value.slice(pos);
    onChange(next);
    detectTrigger(next, pos + 1);
    setTimeout(() => {
      ta.setSelectionRange(pos + 1, pos + 1);
      ta.focus();
    }, 0);
  };

  const handleAutocompleteSelect = (insertValue: string) => {
    const before = value.slice(0, triggerIndex);
    const after = value.slice(textareaRef.current?.selectionStart ?? value.length);
    onChange(`${before}#${insertValue} ${after}`);
    dismissAutocomplete();
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleSendClick = () => {
    if (isLoading) return;
    if (!value.trim()) return;
    if (value.length > 2000) return;
    onSend(value.trim(), referencedFiles);
  };

  return (
    <div className="relative">
      {showAutocomplete && (
        <div className="relative">
          <FileAutocomplete
            files={files}
            triggerIndex={triggerIndex}
            query={autocompleteQuery}
            onSelect={handleAutocompleteSelect}
            onDismiss={dismissAutocomplete}
            anchorRef={textareaRef}
          />
        </div>
      )}

      {followups.length > 0 && !isLoading && (
        <div className="flex flex-wrap gap-2 mb-3">
          {followups.map((text, i) => (
            <button
              key={i}
              onClick={() => onFollowupClick?.(text)}
              className="rounded-full px-4 py-1.5 text-ui-label transition-all duration-[120ms] border animate-in fade-in slide-in-from-bottom-1 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                borderColor: "var(--color-border-default)",
                color: "var(--color-text-secondary)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--color-border-default)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)";
              }}
            >
              {text}
            </button>
          ))}
        </div>
      )}

      <div className="desktop-glass rounded-2xl focus-within:ring-2 focus-within:ring-[color:var(--color-accent)]">
        <div className="flex items-start gap-2 px-4 py-3">
          <button
            onClick={handleHashButtonClick}
            className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-[120ms]"
            style={{
              color: "var(--color-text-tertiary)",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--color-bg-hover)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-tertiary)";
            }}
            title="Reference a file"
            aria-label="Insert file reference"
          >
            <Hash size={15} />
          </button>

          <textarea
            ref={textareaRef}
            id="chat-input"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent py-2 text-body outline-none scrollbar-thin placeholder:text-[color:var(--color-text-tertiary)]"
            style={{
              minHeight: MIN_HEIGHT,
              maxHeight: MAX_HEIGHT,
              color: "var(--color-text-primary)",
              caretColor: "var(--color-accent)",
            }}
            disabled={isLoading}
            aria-label="Chat message input"
            aria-multiline="true"
          />

          {onStop ? (
            <button
              type="button"
              onClick={onStop}
              className="mt-2 flex size-7 shrink-0 items-center justify-center rounded-md bg-bg-hover text-primary hover:bg-bg-active"
              title="Stop generation"
              aria-label="Stop generation"
            >
              <Square size={13} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendClick}
              disabled={isLoading || !value.trim() || value.length > 2000}
              className="mt-2 flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-white transition-colors disabled:bg-bg-hover disabled:text-tertiary"
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          )}
        </div>

        <div
          className="px-4 pb-3 flex justify-between items-center text-ui-label"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          <span>Type # to reference a file. Shift+Enter for new line.</span>
          <span
            style={{
              color:
                value.length > 2000
                  ? "rgb(239, 68, 68)"
                  : value.length > 1800
                    ? "rgb(251, 146, 60)"
                    : "var(--color-text-tertiary)",
              fontWeight: value.length > 1800 ? "bold" : "normal",
            }}
          >
            {value.length}/2000
          </span>
        </div>
      </div>
    </div>
  );
}
