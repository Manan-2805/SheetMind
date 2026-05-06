import { ChatMessageActions } from "./ChatMessageActions";
import { ChatMessageMeta } from "./ChatMessageMeta";
import { ChatResultTable } from "./ChatResultTable";
import { TypingIndicator } from "./TypingIndicator";

import type { ChatMessage as ChatMessageType } from "@/types/ChatMessage";
import { formatRelativeTime } from "@/utils/formatDate";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
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
        <div className="flex items-center gap-2">
          <span className="text-ui-label font-semibold" style={{ color: "var(--color-text-primary)" }}>
            SheetMind
          </span>
          <span className="text-ui-label" style={{ color: "var(--color-text-tertiary)" }}>
            {formatRelativeTime(message.created_at)}
          </span>
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

        {message.result_data && (
          <ChatResultTable data={message.result_data} />
        )}

        {message.nl_summary && (
          <p
            className="text-body italic"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {message.nl_summary}
          </p>
        )}

        <ChatMessageActions />
        <ChatMessageMeta message={message} />
      </div>
    </div>
  );
}
