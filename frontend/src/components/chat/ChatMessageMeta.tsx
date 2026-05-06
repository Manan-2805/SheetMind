import { useState } from "react";
import { ChevronRight } from "lucide-react";

import type { ChatMessage } from "@/types/ChatMessage";

interface ChatMessageMetaProps {
  message: ChatMessage;
}

const CONFIDENCE_COLORS = {
  low: "var(--color-destructive)",
  medium: "var(--color-warning)",
  high: "var(--color-success)",
};

function getConfidenceColor(score: number): string {
  if (score <= 2) return CONFIDENCE_COLORS.low;
  if (score === 3) return CONFIDENCE_COLORS.medium;
  return CONFIDENCE_COLORS.high;
}

export function ChatMessageMeta({ message }: ChatMessageMetaProps) {
  const [expanded, setExpanded] = useState(false);

  const hasMetadata =
    message.token_count_input != null ||
    message.sql_execution_ms != null ||
    message.confidence_score != null;

  if (!hasMetadata) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex items-center gap-1 text-ui-label transition-colors duration-[120ms]"
        style={{ color: "var(--color-text-tertiary)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color =
            "var(--color-text-secondary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color =
            "var(--color-text-tertiary)";
        }}
      >
        <ChevronRight
          size={12}
          style={{
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 150ms ease",
          }}
        />
        Query details
      </button>

      {expanded && (
        <div
          className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-md p-3 text-ui-label"
          style={{
            backgroundColor: "var(--color-bg-hover)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          {message.token_count_input != null && (
            <>
              <span style={{ color: "var(--color-text-tertiary)" }}>
                Tokens in
              </span>
              <span style={{ color: "var(--color-text-secondary)" }}>
                {message.token_count_input.toLocaleString()}
              </span>
            </>
          )}
          {message.token_count_output != null && (
            <>
              <span style={{ color: "var(--color-text-tertiary)" }}>
                Tokens out
              </span>
              <span style={{ color: "var(--color-text-secondary)" }}>
                {message.token_count_output.toLocaleString()}
              </span>
            </>
          )}
          {message.llm_generation_ms != null && (
            <>
              <span style={{ color: "var(--color-text-tertiary)" }}>
                LLM time
              </span>
              <span style={{ color: "var(--color-text-secondary)" }}>
                {message.llm_generation_ms}ms
              </span>
            </>
          )}
          {message.sql_execution_ms != null && (
            <>
              <span style={{ color: "var(--color-text-tertiary)" }}>
                SQL time
              </span>
              <span style={{ color: "var(--color-text-secondary)" }}>
                {message.sql_execution_ms}ms
              </span>
            </>
          )}
          {message.confidence_score != null && (
            <>
              <span style={{ color: "var(--color-text-tertiary)" }}>
                Confidence
              </span>
              <span className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        i < message.confidence_score!
                          ? getConfidenceColor(message.confidence_score!)
                          : "var(--color-border-default)",
                    }}
                  />
                ))}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
