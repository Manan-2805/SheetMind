import {
  BarChart2,
  Code2,
  Download,
  RotateCcw,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatMessageActionsProps {
  onRegenerate?: () => void;
  onThumbUp?: () => void;
  onThumbDown?: () => void;
  onViewChart?: () => void;
  onDownload?: () => void;
  onStar?: () => void;
  onViewSQL?: () => void;
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
    </div>
  );
}
