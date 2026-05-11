import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";

import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { FeedbackModal } from "@/components/chat/FeedbackModal";
import { RegenerateModal } from "@/components/chat/RegenerateModal";
import { QueryResultPanel } from "@/components/QueryResultPanel";
import { SkeletonChatMessage } from "@/components/skeletons/SkeletonChatMessage";
import type { ChatMessage as ChatMessageType, ResultTable } from "@/types/ChatMessage";
import { getDataSources } from "@/api/dataSourcesApi";
import { exportMessage, getMessageData, setMessageFeedback } from "@/api/chatApi";
import { createSavedQuery, generateLabel } from "@/api/savedQueriesApi";
import { useToast } from "@/hooks/useToast";

interface ChatPageProps {
  messages: ChatMessageType[];
  isLoadingMessages: boolean;
  isSending: boolean;
  sendChatMessage: (content: string, files?: string[]) => Promise<void>;
  loadSessions: () => Promise<void>;
  startNewChat: () => void | Promise<unknown>;
  activeSessionId: string | null;
  onUpdateMessage?: (msg: ChatMessageType) => void;
  onDeleteMessage?: (id: string) => void;
  onEditMessage?: (id: string, content: string, files: string[]) => void;
  onRegenerateSubmit?: (msg: ChatMessageType, reason: string, instruction: string) => void;
  onNewChat?: () => void;
  followups?: string[];
  onFollowupClick?: (text: string) => void;
}

interface SaveQueryState {
  msg: ChatMessageType;
  nlQuery: string;
}

export function ChatPage({
  messages,
  isLoadingMessages,
  isSending,
  sendChatMessage,
  loadSessions,
  activeSessionId,
  onUpdateMessage,
  onDeleteMessage,
  onEditMessage,
  onRegenerateSubmit,
  followups,
  onFollowupClick,
}: ChatPageProps) {
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const [hasFiles, setHasFiles] = useState<boolean | null>(null);
  const [sqlModal, setSqlModal] = useState<{ sql: string } | null>(null);
  const [saveModal, setSaveModal] = useState<SaveQueryState | null>(null);
  const [saveLabel, setSaveLabel] = useState("");
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
  const [isSavingQuery, setIsSavingQuery] = useState(false);
  const [activeResult, setActiveResult] = useState<{ message: ChatMessageType; result: ResultTable } | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ msg: ChatMessageType, type: "like" | "dislike" } | null>(null);
  const [regenerateModal, setRegenerateModal] = useState<ChatMessageType | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    getDataSources().then((sources) => {
      if (isMounted) setHasFiles(sources && sources.length > 0);
    }).catch(() => {
      if (isMounted) setHasFiles(false);
    });
    return () => { isMounted = false; };
  }, [activeSessionId]);

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

  const handleThumbUp = useCallback((msg: ChatMessageType) => {
    if (msg.feedback) return; // Prevent if already set
    setFeedbackModal({ msg, type: "like" });
  }, []);

  const handleThumbDown = useCallback((msg: ChatMessageType) => {
    if (msg.feedback) return; // Prevent if already set
    setFeedbackModal({ msg, type: "dislike" });
  }, []);

  const handleFeedbackSubmit = useCallback(async (type: "like" | "dislike") => {
    if (!feedbackModal || !onUpdateMessage) return;
    try {
      await setMessageFeedback(feedbackModal.msg.id, type);
      onUpdateMessage({ ...feedbackModal.msg, feedback: type });
      addToast({ type: "success", title: "Feedback saved", description: "Thank you for your feedback!" });
    } catch {
      addToast({ type: "error", title: "Error", description: "Could not save feedback" });
    }
  }, [feedbackModal, addToast, onUpdateMessage]);

  const handleRegenerate = useCallback((msg: ChatMessageType) => {
    if (!activeSessionId) return;
    setRegenerateModal(msg);
  }, [activeSessionId]);

  const handleRegenerateModalSubmit = useCallback(async (reason: string, instruction: string) => {
    if (!activeSessionId || !regenerateModal || !onRegenerateSubmit) return;
    onRegenerateSubmit(regenerateModal, reason, instruction);
    setRegenerateModal(null);
  }, [activeSessionId, regenerateModal, onRegenerateSubmit]);

  const handleCopyMessage = useCallback((msg: ChatMessageType) => {
    navigator.clipboard.writeText(msg.content);
    addToast({ type: "success", title: "Copied", description: "Message copied to clipboard" });
  }, [addToast]);

  const handleDeleteMessage = useCallback((msg: ChatMessageType) => {
    if (onDeleteMessage) {
      onDeleteMessage(msg.id);
    }
  }, [onDeleteMessage]);

  const handleEditMessage = useCallback((msg: ChatMessageType) => {
    // For now, editing just puts the text back in the input box and prepares a resend
    // But we also need the API call to delete the branch.
    // The useChat handler handles this.
    if (onEditMessage) {
      // In a real edit, we might want to let the user edit the text first in a modal or inline.
      // But based on PRD, we'll just trigger the edit flow.
      const newText = prompt("Edit your message:", msg.content);
      if (newText !== null && newText !== msg.content) {
        onEditMessage(msg.id, newText, msg.referenced_files ?? []);
      }
    }
  }, [onEditMessage]);

  const handleViewChart = useCallback(async (msg: ChatMessageType) => {
    if (!msg.sql_generated || msg.sql_generated.startsWith("ERROR")) {
      addToast({ type: "error", title: "No data", description: "This message has no results to chart." });
      return;
    }
    if (msg.result_data) {
      setActiveResult({ message: msg, result: msg.result_data });
      return;
    }
    if (isLoadingResult) return;

    setIsLoadingResult(true);
    try {
      const result = await getMessageData(msg.id);
      setActiveResult({ message: msg, result });
    } catch {
      addToast({ type: "error", title: "Error", description: "Could not load results for charting" });
    } finally {
      setIsLoadingResult(false);
    }
  }, [addToast, isLoadingResult]);

  const handleExport = useCallback(async (msg: ChatMessageType) => {
    if (!msg.sql_generated || msg.sql_generated.startsWith("ERROR")) {
      addToast({ type: "error", title: "No data", description: "This message has no results to export." });
      return;
    }
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportMessage(msg.id);
      addToast({ type: "success", title: "Exported", description: "Excel file saved to artifacts" });
    } catch {
      addToast({ type: "error", title: "Error", description: "Could not export to Excel" });
    } finally {
      setIsExporting(false);
    }
  }, [addToast, isExporting]);

  const handleViewSQL = useCallback((msg: ChatMessageType) => {
    if (msg.sql_generated) {
      setSqlModal({ sql: msg.sql_generated });
    }
  }, []);

  const handleOpenSaveModal = useCallback((msg: ChatMessageType) => {
    if (!msg.sql_generated) {
      addToast({ type: "error", title: "No SQL", description: "This message has no SQL to save" });
      return;
    }
    const userMessages = messages.filter((m) => m.role === "user");
    const userMsg = userMessages[userMessages.length - 1];
    setSaveModal({ msg, nlQuery: userMsg?.content ?? "" });
    setSaveLabel(userMsg?.content?.slice(0, 60) ?? "");
  }, [messages, addToast]);

  const handleAIGenerateLabel = async () => {
    if (!saveModal) return;
    setIsGeneratingLabel(true);
    try {
      const label = await generateLabel(saveModal.nlQuery, saveModal.msg.sql_generated ?? "");
      setSaveLabel(label);
    } catch {
      addToast({ type: "error", title: "Error", description: "Could not generate label" });
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!saveModal || !saveLabel.trim()) return;
    setIsSavingQuery(true);
    try {
      await createSavedQuery({
        label: saveLabel.trim(),
        nl_query: saveModal.nlQuery,
        sql_query: saveModal.msg.sql_generated ?? "",
      });
      addToast({ type: "success", title: "Query saved", description: `"${saveLabel.trim()}" added to Saved Queries` });
      setSaveModal(null);
      setSaveLabel("");
    } catch {
      addToast({ type: "error", title: "Error", description: "Could not save query" });
    } finally {
      setIsSavingQuery(false);
    }
  };

  const [activeVersions, setActiveVersions] = useState<Record<string, number>>({});

  const groupedMessages = useMemo(() => {
    const groups: (ChatMessageType & { versions?: ChatMessageType[] })[] = [];
    const assistantGroups: Record<string, ChatMessageType[]> = {};

    // First, collect all assistant messages by their parent
    messages.forEach((msg) => {
      if (msg.role === "assistant" && msg.parent_user_message_id) {
        if (!assistantGroups[msg.parent_user_message_id]) {
          assistantGroups[msg.parent_user_message_id] = [];
        }
        assistantGroups[msg.parent_user_message_id].push(msg);
      }
    });

    // Now build the final list
    messages.forEach((msg) => {
      if (msg.role === "user") {
        groups.push(msg);
        const versions = assistantGroups[msg.id];
        if (versions && versions.length > 0) {
          // Sort versions by created_at or version number
          const sortedVersions = [...versions].sort((a, b) => (a.version || 0) - (b.version || 0));
          const activeIdx = activeVersions[msg.id] ?? sortedVersions.length - 1;
          const clampedIdx = Math.max(0, Math.min(activeIdx, sortedVersions.length - 1));
          
          const activeMsg = { ...sortedVersions[clampedIdx], versions: sortedVersions };
          groups.push(activeMsg);
        }
      } else if (msg.role === "assistant" && !msg.parent_user_message_id) {
        // Fallback for assistant messages without parent
        groups.push(msg);
      }
    });

    return groups;
  }, [messages, activeVersions]);

  const handleVersionChange = (parentMsgId: string, delta: number) => {
    const versions = groupedMessages.find((m: ChatMessageType & { versions?: ChatMessageType[] }) => m.parent_user_message_id === parentMsgId)?.versions;
    if (!versions) return;
    
    setActiveVersions((prev: Record<string, number>) => {
      const currentIdx = prev[parentMsgId] ?? versions.length - 1;
      const nextIdx = Math.max(0, Math.min(currentIdx + delta, versions.length - 1));
      return { ...prev, [parentMsgId]: nextIdx };
    });
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
              {groupedMessages.map((msg: ChatMessageType & { versions?: ChatMessageType[] }) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onRegenerate={() => {
                    const userMsg = msg.role === "user" ? msg : groupedMessages.find((m: ChatMessageType) => m.id === msg.parent_user_message_id);
                    if (userMsg) handleRegenerate(userMsg);
                  }}
                  onThumbUp={() => handleThumbUp(msg)}
                  onThumbDown={() => handleThumbDown(msg)}
                  onViewChart={() => handleViewChart(msg)}
                  onDownload={() => handleExport(msg)}
                  onViewSQL={() => handleViewSQL(msg)}
                  onStar={() => handleOpenSaveModal(msg)}
                  onCopy={() => handleCopyMessage(msg)}
                  onEdit={() => handleEditMessage(msg)}
                  onDelete={() => handleDeleteMessage(msg)}
                  onVersionChange={(delta: number) => msg.parent_user_message_id && handleVersionChange(msg.parent_user_message_id, delta)}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl px-6 pb-4">
          {hasFiles === false ? (
            <div
              className="p-4 rounded-lg text-center text-ui-label"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                color: "var(--color-text-tertiary)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              No data sources found. Please upload a file in the Data Sources page before chatting.
            </div>
          ) : (
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              isLoading={isSending || hasFiles === null}
              followups={followups}
              onFollowupClick={onFollowupClick}
            />
          )}
        </div>
      </div>

      {/* SQL Modal */}
      {sqlModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setSqlModal(null)}
        >
          <div
            className="w-full max-w-2xl rounded-xl overflow-hidden"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-default)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--color-border-default)" }}
            >
              <h3 className="text-panel-heading" style={{ color: "var(--color-text-primary)" }}>
                Generated SQL
              </h3>
              <button
                onClick={() => setSqlModal(null)}
                className="rounded-md p-1 transition-colors"
                style={{ color: "var(--color-text-tertiary)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-bg-hover)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-tertiary)";
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 overflow-x-auto">
              <pre
                className="whitespace-pre-wrap break-all rounded-lg p-4"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  backgroundColor: "var(--color-bg-base)",
                  color: "var(--color-accent)",
                  border: "1px solid var(--color-border-subtle)",
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                {sqlModal.sql}
              </pre>
            </div>
            <div
              className="flex justify-end px-5 py-4 gap-2"
              style={{ borderTop: "1px solid var(--color-border-default)" }}
            >
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlModal.sql);
                  addToast({ type: "success", title: "Copied", description: "SQL copied to clipboard" });
                }}
                className="rounded-lg px-4 py-2 text-body-em transition-all duration-[120ms]"
                style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
              >
                Copy SQL
              </button>
              <button
                onClick={() => setSqlModal(null)}
                className="rounded-lg px-4 py-2 text-body-em transition-all duration-[120ms]"
                style={{
                  backgroundColor: "var(--color-bg-hover)",
                  border: "1px solid var(--color-border-default)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Query Modal */}
      {saveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setSaveModal(null)}
        >
          <div
            className="w-full max-w-md rounded-xl overflow-hidden"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-default)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--color-border-default)" }}
            >
              <h3 className="text-panel-heading" style={{ color: "var(--color-text-primary)" }}>
                Save Query
              </h3>
              <button
                onClick={() => setSaveModal(null)}
                className="rounded-md p-1 transition-colors"
                style={{ color: "var(--color-text-tertiary)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-bg-hover)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-tertiary)";
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div>
                <label
                  className="text-ui-label mb-2 block"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  QUERY NAME
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={saveLabel}
                    onChange={(e) => setSaveLabel(e.target.value)}
                    placeholder="e.g. Top customers by revenue"
                    autoFocus
                    className="flex-1 rounded-lg px-3 py-2 text-body outline-none"
                    style={{
                      backgroundColor: "var(--color-bg-hover)",
                      border: "1px solid var(--color-border-default)",
                      color: "var(--color-text-primary)",
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = "var(--color-accent)";
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = "var(--color-border-default)";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleConfirmSave();
                    }}
                  />
                  <button
                    onClick={handleAIGenerateLabel}
                    disabled={isGeneratingLabel}
                    title="Auto-generate label using AI"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-body-em transition-all duration-[120ms] active:scale-[0.97]"
                    style={{
                      backgroundColor: "var(--color-accent-subtle)",
                      border: "1px solid var(--color-accent)",
                      color: "var(--color-accent)",
                      opacity: isGeneratingLabel ? 0.7 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Sparkles size={14} className={isGeneratingLabel ? "animate-spin" : ""} />
                    {isGeneratingLabel ? "..." : "AI Name"}
                  </button>
                </div>
              </div>

              {saveModal.msg.sql_generated && (
                <div>
                  <label
                    className="text-ui-label mb-1.5 block"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    SQL PREVIEW
                  </label>
                  <pre
                    className="rounded-lg p-3 overflow-x-auto"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      backgroundColor: "var(--color-bg-base)",
                      color: "var(--color-accent)",
                      border: "1px solid var(--color-border-subtle)",
                      maxHeight: "120px",
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {saveModal.msg.sql_generated}
                  </pre>
                </div>
              )}
            </div>

            <div
              className="flex justify-end px-5 py-4 gap-2"
              style={{ borderTop: "1px solid var(--color-border-default)" }}
            >
              <button
                onClick={handleConfirmSave}
                disabled={!saveLabel.trim() || isSavingQuery}
                className="rounded-lg px-4 py-2 text-body-em transition-all duration-[120ms] active:scale-[0.97]"
                style={{
                  backgroundColor: saveLabel.trim() && !isSavingQuery ? "var(--color-accent)" : "var(--color-bg-hover)",
                  color: saveLabel.trim() && !isSavingQuery ? "#fff" : "var(--color-text-tertiary)",
                  cursor: saveLabel.trim() && !isSavingQuery ? "pointer" : "not-allowed",
                }}
              >
                {isSavingQuery ? "Saving..." : "Save Query"}
              </button>
              <button
                onClick={() => setSaveModal(null)}
                className="rounded-lg px-4 py-2 text-body-em transition-all duration-[120ms]"
                style={{
                  backgroundColor: "var(--color-bg-hover)",
                  border: "1px solid var(--color-border-default)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {activeResult && (
        <QueryResultPanel
          open={!!activeResult}
          onClose={() => setActiveResult(null)}
          title="Chat result"
          result={activeResult.result}
          onExport={() => handleExport(activeResult.message)}
          exporting={isExporting}
          exportLabel="Export to Excel"
        />
      )}

      <FeedbackModal
        isOpen={!!feedbackModal}
        onClose={() => setFeedbackModal(null)}
        onSubmit={(type) => handleFeedbackSubmit(type)}
        type={feedbackModal?.type || "like"}
      />

      <RegenerateModal
        isOpen={!!regenerateModal}
        onClose={() => setRegenerateModal(null)}
        onSubmit={handleRegenerateModalSubmit}
      />
    </div>
  );
}
