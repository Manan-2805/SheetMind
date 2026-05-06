import { useCallback, useState } from "react";

import {
  createSession,
  getMessages,
  getSessions,
  sendMessage,
} from "@/api/chatApi";
import { useToast } from "@/hooks/useToast";
import type { ChatMessage, ChatSession } from "@/types/ChatMessage";

const TYPING_ID = "__typing__";

export function useChat() {
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({
        type: "error",
        title: "Error",
        description: e?.message ?? "Failed to load sessions",
      });
    } finally {
      setIsLoadingSessions(false);
    }
  }, [addToast]);

  const selectSession = useCallback(
    async (sessionId: string) => {
      setActiveSessionId(sessionId);
      setMessages([]);
      setIsLoadingMessages(true);
      try {
        const data = await getMessages(sessionId);
        setMessages(data);
      } catch (err: unknown) {
        const e = err as { message?: string };
        addToast({
          type: "error",
          title: "Error",
          description: e?.message ?? "Failed to load messages",
        });
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [addToast]
  );

  const startNewChat = useCallback(async () => {
    try {
      const session = await createSession();
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
      return session;
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({
        type: "error",
        title: "Error",
        description: e?.message ?? "Failed to create session",
      });
      return null;
    }
  }, [addToast]);

  const sendChatMessage = useCallback(
    async (content: string, referencedFiles: string[] = []) => {
      let sessionId = activeSessionId;

      if (!sessionId) {
        const session = await startNewChat();
        if (!session) return;
        sessionId = session.id;
      }

      const userMessage: ChatMessage = {
        id: `optimistic-user-${Date.now()}`,
        session_id: sessionId,
        role: "user",
        content,
        created_at: new Date().toISOString(),
        referenced_files: referencedFiles,
      };

      const typingMessage: ChatMessage = {
        id: TYPING_ID,
        session_id: sessionId,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
        is_typing: true,
      };

      setMessages((prev) => [...prev, userMessage, typingMessage]);
      setIsSending(true);

      try {
        const response = await sendMessage(sessionId, content, referencedFiles);
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== TYPING_ID)
            .concat(response)
        );
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, updated_at: new Date().toISOString() }
              : s
          )
        );
      } catch (err: unknown) {
        setMessages((prev) => prev.filter((m) => m.id !== TYPING_ID));
        const e = err as { message?: string };
        addToast({
          type: "error",
          title: "Error",
          description: e?.message ?? "Failed to send message",
        });
      } finally {
        setIsSending(false);
      }
    },
    [activeSessionId, startNewChat, addToast]
  );

  return {
    sessions,
    activeSessionId,
    messages,
    isLoadingSessions,
    isLoadingMessages,
    isSending,
    loadSessions,
    selectSession,
    startNewChat,
    sendChatMessage,
    setActiveSessionId,
    setMessages,
  };
}
