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
  const hasMetadata =
    message.token_count_input != null ||
    message.sql_execution_ms != null ||
    message.confidence_score != null;

  if (!hasMetadata) return null;

  return (
    <div
      className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-md p-2 text-ui-label"
      style={{
        backgroundColor: "transparent",
        minWidth: "200px"
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
  );
}
