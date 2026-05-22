import {
  BarChart2,
  Code2,
  Download,
  RotateCcw,
  Star,
  ThumbsDown,
  ThumbsUp,
  Info,
  Copy,
  Edit2,
  Trash2,
  Table,
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
  onCopy?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopyTable?: () => void;
  message: ChatMessage;
}

const ACTIONS = [
  { icon: RotateCcw, label: "Regenerate", key: "regenerate" as const, role: "assistant" },
  { icon: Copy, label: "Copy Text", key: "copy" as const, role: "both" },
  { icon: Table, label: "Copy Table (CSV)", key: "copyTable" as const, role: "assistant" },
  { icon: Edit2, label: "Edit", key: "edit" as const, role: "user" },
  { icon: Trash2, label: "Delete", key: "delete" as const, role: "user" },
  { icon: ThumbsUp, label: "Good response", key: "thumbUp" as const, role: "assistant" },
  { icon: ThumbsDown, label: "Bad response", key: "thumbDown" as const, role: "assistant" },
  { icon: BarChart2, label: "View as chart", key: "chart" as const, role: "assistant" },
  { icon: Download, label: "Export to Excel", key: "download" as const, role: "assistant" },
  { icon: Star, label: "Save query", key: "star" as const, role: "assistant" },
  { icon: Code2, label: "View SQL", key: "sql" as const, role: "assistant" },
];

export function ChatMessageActions({
  onRegenerate,
  onThumbUp,
  onThumbDown,
  onViewChart,
  onDownload,
  onStar,
  onViewSQL,
  onCopy,
  onEdit,
  onDelete,
  onCopyTable,
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
    copy: onCopy,
    edit: onEdit,
    delete: onDelete,
    copyTable: onCopyTable,
  };

  const filteredActions = ACTIONS.filter(a => {
    if (a.role !== "both" && a.role !== message.role) return false;
    if (a.key === "copyTable" && !message.sql_generated) return false;
    return true;
  });

  return (
    <div className="flex items-center gap-0.5 mt-1">
      {filteredActions.map(({ icon: Icon, label, key }) => {
        const isFeedbackAction = key === "thumbUp" || key === "thumbDown";
        const isSelected = (key === "thumbUp" && message.feedback === "like") ||
                          (key === "thumbDown" && message.feedback === "dislike");
        const isDisabled = isFeedbackAction && !!message.feedback;

        return (
          <Tooltip key={key}>
            <TooltipTrigger
              render={
                <button
                  onClick={isDisabled ? undefined : handlers[key]}
                  disabled={isDisabled}
                  className={`rounded p-1 transition-colors duration-[120ms] ${
                    isSelected ? "bg-white/10" : ""
                  }`}
                  style={{
                    color: isSelected
                      ? "var(--color-accent)"
                      : "var(--color-text-tertiary)",
                    opacity: isDisabled && !isSelected ? 0.3 : 1,
                    cursor: isDisabled ? "default" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (isDisabled || isSelected) return;
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--color-text-primary)";
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "var(--color-bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (isDisabled || isSelected) return;
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
        );
      })}

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
