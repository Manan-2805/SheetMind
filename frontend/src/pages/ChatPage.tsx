import { useEffect, useRef, useState } from "react";

import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { SkeletonChatMessage } from "@/components/skeletons/SkeletonChatMessage";
import type { ChatMessage as ChatMessageType } from "@/types/ChatMessage";

interface ChatPageProps {
  messages: ChatMessageType[];
  isLoadingMessages: boolean;
  isSending: boolean;
  sendChatMessage: (content: string, files?: string[]) => Promise<void>;
  loadSessions: () => Promise<void>;
  startNewChat: () => Promise<unknown>;
  onNewChat?: () => void;
}

export function ChatPage({
  messages,
  isLoadingMessages,
  isSending,
  sendChatMessage,
  loadSessions,
}: ChatPageProps) {
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      loadSessions();
      isFirstLoad.current = false;
    }
  }, [loadSessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isSending) return;
    setInputValue("");
    await sendChatMessage(text);
  };

  const handleSuggestion = (text: string) => {
    setInputValue(text);
  };

  const isEmpty = messages.length === 0 && !isLoadingMessages;

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: "var(--color-bg-base)" }}>
      <div className="flex flex-1 flex-col overflow-hidden">
        {isLoadingMessages ? (
          <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
            <SkeletonChatMessage />
            <SkeletonChatMessage />
          </div>
        ) : isEmpty ? (
          <ChatEmptyState onSuggestion={handleSuggestion} />
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
            <div className="mx-auto max-w-3xl">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl px-6 pb-4">
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            isLoading={isSending}
          />
        </div>
      </div>
    </div>
  );
}
