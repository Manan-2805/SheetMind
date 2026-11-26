import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createSession,
  deleteMessageBranch,
  editMessage,
  getMessages,
  getSessions,
  regenerateMessage,
  sendMessage,
} from "@/api/chatApi";
import { useToast } from "@/hooks/useToast";
import { websocketService } from "@/services/websocketService";
import type { ChatMessage, ChatSession } from "@/types/ChatMessage";

const TYPING_ID = "__typing__";

export function useChat() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendFailure, setSendFailure] = useState<{
    sessionId: string | null;
    message: string;
  } | null>(null);
  const [followups, setFollowups] = useState<string[]>([]);
  const [sqlRetryStatus, setSqlRetryStatus] = useState<{
    attempt: number;
    max: number;
    error?: string;
  } | null>(null);

  const activeSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    const removeListener = websocketService.addListener((payload) => {
      if (payload.session_id && payload.session_id !== activeSessionIdRef.current) {
        return;
      }
      if (payload.type === "sql_retry") {
        setSqlRetryStatus({
          attempt: payload.attempt,
          max: payload.max,
          error: payload.error,
        });
        setMessages((prev) =>
          prev.map((msg) => (msg.id === TYPING_ID ? { ...msg, typing_status: "fixing_sql" } : msg))
        );
      } else if (payload.type === "chat_status") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === TYPING_ID ? { ...msg, typing_status: payload.status } : msg
          )
        );
      }
    });

    return () => {
      removeListener();
    };
  }, []);

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
        const lastMsg = data[data.length - 1];
        if (lastMsg?.role === "assistant" && lastMsg.followups) {
          setFollowups(lastMsg.followups);
        } else {
          setFollowups([]);
        }
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

  const startNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setFollowups([]);
  }, []);

  const sendChatMessage = useCallback(
    async (content: string, referencedFiles: string[] = []) => {
      setSendFailure(null);
      let sessionId = activeSessionId;
      let isNewSession = false;

      if (!sessionId) {
        try {
          const session = await createSession();
          setSessions((prev) => [session, ...prev]);
          sessionId = session.id;
          setActiveSessionId(sessionId);
          isNewSession = true;
        } catch (err: unknown) {
          const e = err as { message?: string };
          setSendFailure({
            sessionId: null,
            message: e?.message ?? "Could not start a conversation.",
          });
          return;
        }
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
        parent_user_message_id: userMessage.id,
      };

      setMessages((prev) => [...prev, userMessage, typingMessage]);
      setSqlRetryStatus(null);
      setIsSending(true);

      if (isNewSession) {
        navigate(`/${sessionId}`, { replace: true });
      }

      // Small delay to ensure the typing indicator is rendered before the API response potentially replaces it
      await new Promise((resolve) => setTimeout(resolve, 80));

      try {
        const response = await sendMessage(sessionId, content, referencedFiles);
        setSqlRetryStatus(null);
        setMessages((prev) => {
          const updated = prev
            .filter((m) => m.id !== TYPING_ID)
            .map((m) => {
              if (m.id === userMessage.id && response.parent_user_message_id) {
                return { ...m, id: response.parent_user_message_id };
              }
              return m;
            });
          return updated.concat(response);
        });
        if (response.followups) {
          setFollowups(response.followups);
        }
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  updated_at: new Date().toISOString(),
                  title: response.session_title ?? s.title,
                }
              : s
          )
        );
      } catch (err: unknown) {
        setSqlRetryStatus(null);
        setMessages((prev) => prev.filter((m) => m.id !== TYPING_ID));
        const e = err as { message?: string };
        setSendFailure({ sessionId, message: e?.message ?? "Could not send the message." });
      } finally {
        setIsSending(false);
      }
    },
    [activeSessionId, navigate]
  );

  const deleteMessageBranchHandler = useCallback(
    async (messageId: string) => {
      if (!activeSessionId) return;
      try {
        await deleteMessageBranch(activeSessionId, messageId);
        const msgToDelete = messages.find((m) => m.id === messageId);
        if (msgToDelete) {
          setMessages((prev) => prev.filter((m) => m.created_at < msgToDelete.created_at));
        }
        addToast({ type: "success", title: "Deleted", description: "Message branch removed" });
      } catch (err: unknown) {
        const e = err as { message?: string };
        addToast({ type: "error", title: "Error", description: e.message ?? "Failed to delete" });
      }
    },
    [activeSessionId, messages, addToast]
  );

  const editMessageHandler = useCallback(
    async (messageId: string, content: string, referencedFiles: string[]) => {
      if (!activeSessionId) return;

      const typingMessage: ChatMessage = {
        id: TYPING_ID,
        session_id: activeSessionId,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
        is_typing: true,
        parent_user_message_id: messageId,
      };

      const targetMsg = messages.find((m) => m.id === messageId);
      if (!targetMsg) return;

      // Optimistically update: delete everything after targetMsg time and add typing
      setMessages((prev) => [
        ...prev.filter((m) => m.created_at < targetMsg.created_at),
        {
          ...targetMsg,
          content,
          referenced_files: referencedFiles,
          created_at: new Date().toISOString(),
        },
        typingMessage,
      ]);
      setFollowups([]);
      setSqlRetryStatus(null);
      setIsSending(true);

      try {
        const response = await editMessage(activeSessionId, messageId, content, referencedFiles);
        setSqlRetryStatus(null);
        setMessages((prev) => {
          const updated = prev
            .filter((m) => m.id !== TYPING_ID)
            .map((m) => {
              if (m.id === messageId && response.parent_user_message_id) {
                return { ...m, id: response.parent_user_message_id };
              }
              return m;
            });
          return updated.concat(response);
        });
        if (response.followups) {
          setFollowups(response.followups);
        }
      } catch (err: unknown) {
        const e = err as { message?: string };
        setMessages((prev) => prev.filter((m) => m.id !== TYPING_ID));
        addToast({ type: "error", title: "Error", description: e.message ?? "Failed to edit" });
        // Re-load to sync state
        const data = await getMessages(activeSessionId);
        setMessages(data);
      } finally {
        setIsSending(false);
      }
    },
    [activeSessionId, messages, addToast]
  );

  const regenerateResponseHandler = useCallback(
    async (msg: ChatMessage, reason: string, instruction: string) => {
      if (!activeSessionId) return;

      // Find the actual user message that this assistant message belongs to
      const parentId = msg.role === "user" ? msg.id : msg.parent_user_message_id;
      if (!parentId) return;

      const typingMessage: ChatMessage = {
        id: TYPING_ID,
        session_id: activeSessionId,
        role: "assistant",
        content: "",
        created_at: new Date(Date.now() + 1000).toISOString(), // Ensure it's after the user message
        is_typing: true,
        parent_user_message_id: parentId,
      };

      setMessages((prev) => [...prev.filter((m) => m.id !== TYPING_ID), typingMessage]);
      setFollowups([]);
      setSqlRetryStatus(null);
      setIsSending(true);

      try {
        const response = await regenerateMessage(
          activeSessionId,
          msg.content,
          msg.referenced_files ?? [],
          reason,
          instruction,
          parentId // Correctly pass the user message ID
        );
        setSqlRetryStatus(null);
        setMessages((prev) => prev.filter((m) => m.id !== TYPING_ID).concat(response));
        if (response.followups) {
          setFollowups(response.followups);
        }
      } catch (err: unknown) {
        const e = err as { message?: string };
        setMessages((prev) => prev.filter((m) => m.id !== TYPING_ID));
        addToast({
          type: "error",
          title: "Error",
          description: e.message ?? "Failed to regenerate",
        });
        // Reload messages to ensure sync if something went wrong
        const data = await getMessages(activeSessionId);
        setMessages(data);
      } finally {
        setIsSending(false);
      }
    },
    [activeSessionId, addToast]
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
    deleteMessageBranch: deleteMessageBranchHandler,
    editMessage: editMessageHandler,
    regenerateResponse: regenerateResponseHandler,
    setActiveSessionId,
    setMessages,
    followups,
    setFollowups,
    sqlRetryStatus,
    sendError: sendFailure?.sessionId === activeSessionId ? sendFailure.message : null,
  };
}
