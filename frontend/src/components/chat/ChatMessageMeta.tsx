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
  const totalTokens = message.total_tokens ?? (message.token_count_input || 0) + (message.token_count_output || 0);

  return (
    <div
      className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-md p-2 text-ui-label"
      style={{
        backgroundColor: "transparent",
        minWidth: "220px"
      }}
    >
      <span style={{ color: "var(--color-text-tertiary)" }}>Model</span>
      <span className="text-right" style={{ color: "var(--color-text-secondary)" }}>{message.model_name || "N/A"}</span>

      <span style={{ color: "var(--color-text-tertiary)" }}>SQL Gen</span>
      <span className="text-right" style={{ color: "var(--color-text-secondary)" }}>{message.sql_gen_ms ?? "N/A"}ms</span>

      <span style={{ color: "var(--color-text-tertiary)" }}>SQL Exec</span>
      <span className="text-right" style={{ color: "var(--color-text-secondary)" }}>{message.sql_execution_ms ?? "N/A"}ms</span>

      <span style={{ color: "var(--color-text-tertiary)" }}>Summary</span>
      <span className="text-right" style={{ color: "var(--color-text-secondary)" }}>{message.summary_gen_ms ?? "N/A"}ms</span>

      <div className="col-span-2 h-[1px] my-1" style={{ backgroundColor: "var(--color-border-default)" }} />

      <span className="font-medium" style={{ color: "var(--color-text-tertiary)" }}>Total Time</span>
      <span className="text-right font-medium" style={{ color: "var(--color-text-primary)" }}>{message.total_ms ?? "N/A"}ms</span>

      <span style={{ color: "var(--color-text-tertiary)" }}>Input Tokens</span>
      <span className="text-right" style={{ color: "var(--color-text-secondary)" }}>{message.token_count_input ?? "N/A"}</span>

      <span style={{ color: "var(--color-text-tertiary)" }}>Output Tokens</span>
      <span className="text-right" style={{ color: "var(--color-text-secondary)" }}>{message.token_count_output ?? "N/A"}</span>

      <span className="font-medium" style={{ color: "var(--color-text-tertiary)" }}>Total Tokens</span>
      <span className="text-right font-medium" style={{ color: "var(--color-text-primary)" }}>{totalTokens || "N/A"}</span>

      {message.confidence_score != null && (
        <>
          <span style={{ color: "var(--color-text-tertiary)" }}>Confidence</span>
          <span className="flex items-center justify-end gap-1">
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
  );
}
