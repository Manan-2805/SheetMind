import {
  BarChart2,
  Code2,
  Download,
  RotateCcw,
  Star,
  ThumbsDown,
  ThumbsUp,
  Info,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatMessageMeta } from "./ChatMessageMeta";
import type { ChatMessage } from "@/types/ChatMessage";

interface ChatMessageActionsProps {
  onRegenerate?: () => void;
  onThumbUp?: () => void;
  onThumbDown?: () => void;
  onViewChart?: () => void;
  onDownload?: () => void;
  onStar?: () => void;
  onViewSQL?: () => void;
  message: ChatMessage;
}

const ACTIONS = [
  { icon: RotateCcw, label: "Regenerate", key: "regenerate" as const },
  { icon: ThumbsUp, label: "Good response", key: "thumbUp" as const },
  { icon: ThumbsDown, label: "Bad response", key: "thumbDown" as const },
  { icon: BarChart2, label: "View as chart", key: "chart" as const },
  { icon: Download, label: "Export to Excel", key: "download" as const },
  { icon: Star, label: "Save query", key: "star" as const },
  { icon: Code2, label: "View SQL", key: "sql" as const },
];

export function ChatMessageActions({
  onRegenerate,
  onThumbUp,
  onThumbDown,
  onViewChart,
  onDownload,
  onStar,
  onViewSQL,
  message,
}: ChatMessageActionsProps) {
  const handlers = {
    regenerate: onRegenerate,
    thumbUp: onThumbUp,
    thumbDown: onThumbDown,
    chart: onViewChart,
    download: onDownload,
    star: onStar,
    sql: onViewSQL,
  };

  return (
    <div className="flex items-center gap-0.5 mt-1">
      {ACTIONS.map(({ icon: Icon, label, key }) => (
        <Tooltip key={key}>
          <TooltipTrigger
            render={
              <button
                onClick={handlers[key]}
                className={`rounded p-1 transition-colors duration-[120ms] ${
                  (key === "thumbUp" && message.feedback === "like") ||
                  (key === "thumbDown" && message.feedback === "dislike")
                    ? "bg-white/10 text-white"
                    : ""
                }`}
                style={{
                  color:
                    (key === "thumbUp" && message.feedback === "like") ||
                    (key === "thumbDown" && message.feedback === "dislike")
                      ? "var(--color-accent)"
                      : "var(--color-text-tertiary)",
                }}
                onMouseEnter={(e) => {
                  if (
                    (key === "thumbUp" && message.feedback === "like") ||
                    (key === "thumbDown" && message.feedback === "dislike")
                  )
                    return;
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--color-text-primary)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "var(--color-bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (
                    (key === "thumbUp" && message.feedback === "like") ||
                    (key === "thumbDown" && message.feedback === "dislike")
                  )
                    return;
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--color-text-tertiary)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                }}
                aria-label={label}
              >
                <Icon size={14} />
              </button>
            }
          />
          <TooltipContent
            style={{
              backgroundColor: "var(--color-bg-active)",
              border: "1px solid var(--color-border-default)",
              color: "var(--color-text-primary)",
              fontSize: "11px",
            }}
          >
            {label}
          </TooltipContent>
        </Tooltip>
      ))}

      {/* Info Hover Tooltip */}
      {(message.token_count_input != null || message.sql_execution_ms != null || message.confidence_score != null) && (
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                className="rounded p-1 transition-colors duration-[120ms]"
                style={{ color: "var(--color-text-tertiary)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--color-text-primary)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "var(--color-bg-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--color-text-tertiary)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                }}
                aria-label="Query details"
              >
                <Info size={14} />
              </button>
            }
          />
          <TooltipContent
            side="top"
            style={{
              backgroundColor: "var(--color-bg-active)",
              border: "1px solid var(--color-border-default)",
              color: "var(--color-text-primary)",
              fontSize: "11px",
              padding: "4px"
            }}
          >
            <ChatMessageMeta message={message} />
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
