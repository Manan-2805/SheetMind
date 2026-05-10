import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { ChatMessageActions } from "./ChatMessageActions";
import { ChatResultTable } from "./ChatResultTable";
import { TypingIndicator } from "./TypingIndicator";

import { getMessageData } from "@/api/chatApi";
import type { ChatMessage as ChatMessageType, ResultTable } from "@/types/ChatMessage";
import { formatRelativeTime } from "@/utils/formatDate";

interface ChatMessageProps {
  message: ChatMessageType & { versions?: ChatMessageType[] };
  onRegenerate?: () => void;
  onThumbUp?: () => void;
  onThumbDown?: () => void;
  onViewChart?: () => void;
  onDownload?: () => void;
  onStar?: () => void;
  onViewSQL?: () => void;
  onVersionChange?: (delta: number) => void;
}

export function ChatMessage({ 
  message,
  onRegenerate,
  onThumbUp,
  onThumbDown,
  onViewChart,
  onDownload,
  onStar,
  onViewSQL,
  onVersionChange,
}: ChatMessageProps) {
  const [localData, setLocalData] = useState<ResultTable | null>(message.result_data || null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  useEffect(() => {
    if (message.role === "assistant" && message.sql_generated && !message.sql_generated.startsWith("ERROR") && !message.result_data && !localData && !isLoadingData && !message.is_typing && !fetchAttempted) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setFetchAttempted(true);
      setIsLoadingData(true);
      /* eslint-enable react-hooks/set-state-in-effect */
      getMessageData(message.id)
        .then(setLocalData)
        .catch(console.error)
        .finally(() => setIsLoadingData(false));
    }
  }, [message, localData, isLoadingData, fetchAttempted]);

  if (message.is_typing) {
    return <TypingIndicator />;
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end py-2">
        <div
          className="max-w-[60%] rounded-xl px-4 py-2.5 text-body"
          style={{
            backgroundColor: "var(--color-bg-hover)",
            color: "var(--color-text-primary)",
            borderBottomRightRadius: "2px",
            border: "1px solid var(--color-border-default)",
          }}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex gap-3 py-4">
      <div
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
        aria-hidden="true"
      >
        S
      </div>

      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-ui-label font-semibold" style={{ color: "var(--color-text-primary)" }}>
              SheetMind
            </span>
            <span className="text-ui-label" style={{ color: "var(--color-text-tertiary)" }}>
              {formatRelativeTime(message.created_at)}
            </span>
          </div>

          {message.versions && message.versions.length > 1 && (
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => onVersionChange?.(-1)}
                disabled={(message.versions.findIndex(v => v.id === message.id)) === 0}
                className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] disabled:opacity-30"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[10px] font-medium" style={{ color: "var(--color-text-tertiary)" }}>
                {(message.versions.findIndex(v => v.id === message.id)) + 1} / {message.versions.length}
              </span>
              <button
                onClick={() => onVersionChange?.(1)}
                disabled={(message.versions.findIndex(v => v.id === message.id)) === message.versions.length - 1}
                className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] disabled:opacity-30"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        <p
          className="text-body whitespace-pre-wrap"
          style={{ color: "var(--color-text-primary)" }}
          dangerouslySetInnerHTML={{
            __html: message.content
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/`(.*?)`/g, '<code style="font-family: var(--font-mono); font-size: 12px; background: var(--color-bg-hover); padding: 1px 4px; border-radius: 3px;">$1</code>'),
          }}
        />

        {isLoadingData ? (
          <p className="text-body italic" style={{ color: "var(--color-text-tertiary)" }}>Loading table data...</p>
        ) : (message.result_data || localData) ? (
          <ChatResultTable data={message.result_data || localData!} />
        ) : null}

        {message.nl_summary && (
          <p
            className="text-body italic"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {message.nl_summary}
          </p>
        )}

        <ChatMessageActions 
          message={message} 
          onRegenerate={onRegenerate}
          onThumbUp={onThumbUp}
          onThumbDown={onThumbDown}
          onViewChart={onViewChart}
          onDownload={onDownload}
          onStar={onStar}
          onViewSQL={onViewSQL}
        />
      </div>
    </div>
  );
}
