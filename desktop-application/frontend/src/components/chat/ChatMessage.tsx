import { ChevronLeft, ChevronRight, Hash } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChatMessageActions } from "./ChatMessageActions";
import { ExcelPreviewGrid } from "../ExcelPreviewGrid";
import { TypingIndicator } from "./TypingIndicator";

import { getMessageData } from "@/api/chatApi";
import { FileAutocomplete } from "./FileAutocomplete";
import { useFileAutocomplete } from "@/hooks/useFileAutocomplete";
import type { ChatMessage as ChatMessageType, ResultTable } from "@/types/ChatMessage";
import { extractReferencedFiles } from "@/utils/chatReferences";
import { formatRelativeTime } from "@/utils/formatDate";
import { useToast } from "@/hooks/useToast";

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
  onCopy?: () => void;
  onEdit?: (id: string, content: string, files: string[]) => void;
  onDelete?: () => void;
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
  onCopy,
  onEdit,
  onDelete,
}: ChatMessageProps) {
  const [localData, setLocalData] = useState<ResultTable | null>(message.result_data || null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const { addToast } = useToast();

  const chartUrl = message.chart_url || (message.result_data as unknown as Record<string, unknown> | null)?.chart_url as string | undefined;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalData(message.result_data || null);
  }, [message.id, message.result_data]);

  const getFullChartUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    const backendBase = "http://localhost:8000";
    return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handlePageChange = async (newPage: number) => {
    if (isLoadingData) return;
    setIsLoadingData(true);
    try {
      const data = await getMessageData(message.id, newPage);
      setLocalData(data);
    } catch (e) {
      console.error(e);
      addToast({ type: "error", title: "Error", description: "Failed to load page data" });
    } finally {
      setIsLoadingData(false);
    }
  };

  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    showAutocomplete,
    autocompleteQuery,
    triggerIndex,
    files,
    detectTrigger,
    dismiss: dismissAutocomplete,
  } = useFileAutocomplete();

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

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const referencedFiles = useMemo(
    () => extractReferencedFiles(editContent, files),
    [editContent, files]
  );

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onEdit?.(message.id, editContent, referencedFiles);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
    dismissAutocomplete();
  };

  const handleAutocompleteSelect = (insertValue: string) => {
    const pos = editTextareaRef.current?.selectionStart ?? editContent.length;
    const before = editContent.slice(0, triggerIndex);
    const after = editContent.slice(pos);
    const newVal = `${before}#${insertValue} ${after}`;
    setEditContent(newVal);
    dismissAutocomplete();
    setTimeout(() => {
      editTextareaRef.current?.focus();
      const newPos = before.length + insertValue.length + 2;
      editTextareaRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleCopyTable = () => {
    const data = message.result_data || localData;
    if (!data) return;

    const headers = data.columns.map(c => c.label).join(",");
    const rows = data.rows.map(row =>
      data.columns.map(col => {
        const val = row[col.key];
        return typeof val === "string" && val.includes(",") ? `"${val}"` : String(val ?? "");
      }).join(",")
    ).join("\n");

    const csv = `${headers}\n${rows}`;
    navigator.clipboard.writeText(csv);
    addToast({ type: "success", title: "Copied", description: "Table data copied as CSV" });
  };

  const renderContent = (content: string) => {
    // 1. Handle Bold
    let html = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // 2. Handle Inline Code
    html = html.replace(/`(.*?)`/g, '<code style="font-family: var(--font-mono); font-size: 12px; background: var(--color-bg-hover); padding: 1px 4px; border-radius: 3px;">$1</code>');
    
    // 3. Simple Markdown Table Parser
    if (html.includes("|") && html.includes("---")) {
      const lines = html.split("\n");
      let inTable = false;
      const resultLines = [];
      let tableRows = [];

      for (const line of lines) {
        if (line.trim().startsWith("|")) {
          if (!inTable) inTable = true;
          const cells = line.split("|").filter(c => c.trim().length >= 0).slice(1, -1);
          if (line.includes("---")) continue; // separator row
          tableRows.push(cells);
        } else {
          if (inTable) {
            // Render the table
            const tableHtml = `<table>
              <thead><tr>${tableRows[0] ? tableRows[0].map(c => `<th>${c.trim()}</th>`).join("") : ""}</tr></thead>
              <tbody>${tableRows.slice(1).map(r => `<tr>${r.map(c => `<td>${c.trim()}</td>`).join("")}</tr>`).join("")}</tbody>
            </table>`;
            resultLines.push(tableHtml);
            tableRows = [];
            inTable = false;
          }
          resultLines.push(line);
        }
      }
      if (inTable && tableRows.length > 0) {
        const tableHtml = `<table>
          <thead><tr>${tableRows[0] ? tableRows[0].map(c => `<th>${c.trim()}</th>`).join("") : ""}</tr></thead>
          <tbody>${tableRows.slice(1).map(r => `<tr>${r.map(c => `<td>${c.trim()}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>`;
        resultLines.push(tableHtml);
      }
      html = resultLines.join("<br/>");
    }

    return html;
  };

  if (message.is_typing) {
    return <TypingIndicator status={message.typing_status} />;
  }

  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end py-2">
        {isEditing ? (
          <div className="w-full max-w-[80%] flex flex-col gap-2 relative">
            {showAutocomplete && (
              <FileAutocomplete
                files={files}
                triggerIndex={triggerIndex}
                query={autocompleteQuery}
                onSelect={handleAutocompleteSelect}
                onDismiss={dismissAutocomplete}
                anchorRef={editTextareaRef}
              />
            )}
            <div className="relative">
              <textarea
                ref={editTextareaRef}
                autoFocus
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  detectTrigger(e.target.value, e.target.selectionStart ?? 0);
                }}
                className="w-full rounded-xl px-4 py-3 text-body outline-none border focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1 focus:ring-offset-[var(--color-bg-base)] transition-all resize-none scrollbar-thin"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  color: "var(--color-text-primary)",
                  borderColor: "var(--color-border-default)",
                  minHeight: "120px",
                }}
                onKeyDown={(e) => {
                  if (showAutocomplete && ["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) {
                    return;
                  }
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />
              <button
                onClick={() => {
                  const ta = editTextareaRef.current;
                  if (!ta) return;
                  const pos = ta.selectionStart ?? editContent.length;
                  const next = editContent.slice(0, pos) + "#" + editContent.slice(pos);
                  setEditContent(next);
                  detectTrigger(next, pos + 1);
                  setTimeout(() => {
                    ta.setSelectionRange(pos + 1, pos + 1);
                    ta.focus();
                  }, 0);
                }}
                className="absolute right-3 bottom-3 p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] transition-colors"
                style={{ color: "var(--color-text-tertiary)" }}
                title="Reference a file"
              >
                <Hash size={14} />
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-lg text-ui-label font-medium transition-colors"
                style={{
                  backgroundColor: "var(--color-bg-hover)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border-default)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 rounded-lg text-ui-label font-medium transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "#fff",
                }}
              >
                Save & Resend
              </button>
            </div>
          </div>
        ) : (
          <>
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
            <ChatMessageActions
              message={message}
              onCopy={onCopy}
              onEdit={() => setIsEditing(true)}
              onDelete={onDelete}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="group flex gap-3 py-4">
      <img
        src="/favicon.png"
        alt="SheetMind"
        className="mt-0.5 h-5 w-5 shrink-0 rounded-sm object-contain shadow-sm"
        aria-hidden="true"
      />

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

        <div
          className="text-body whitespace-pre-wrap bot-message-content"
          style={{ color: "var(--color-text-primary)" }}
          dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
        />

        {/* Render Auto Chart */}
        {chartUrl && (
          <div
            className="mt-4 border rounded-xl overflow-hidden p-4 flex flex-col items-center justify-center bg-[#1E1E1E]/50 backdrop-blur-md animate-in fade-in"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <span
              className="text-ui-label font-semibold mb-2 self-start"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Auto Generated Chart
            </span>
            <img
              src={getFullChartUrl(chartUrl)}
              alt="Auto Generated Chart"
              className="max-h-[300px] w-auto object-contain rounded-lg shadow-lg border"
              style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
              onError={(e) => {
                console.error("Failed to load chart image:", e);
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        {isLoadingData && !localData ? (
          <p className="text-body italic mt-4 animate-pulse" style={{ color: "var(--color-text-tertiary)" }}>Loading table data...</p>
        ) : (localData || message.result_data) ? (
          <div className="mt-4 flex flex-col gap-2">
            <div
              className="border rounded-xl overflow-hidden relative"
              style={{ borderColor: "var(--color-border-default)", height: "300px" }}
            >
              {isLoadingData && (
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10 flex items-center justify-center">
                  <span className="text-body font-medium text-white">Loading page...</span>
                </div>
              )}
              <ExcelPreviewGrid result={localData || message.result_data!} />
            </div>

            {/* Pagination Controls */}
            {((localData || message.result_data)?.total_pages ?? 1) > 1 && (
              <div className="flex items-center justify-between px-2 py-1 bg-transparent text-ui-label mt-1">
                <span
                  className="text-body text-[12px]"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Showing page {(localData || message.result_data)?.page ?? 1} of {(localData || message.result_data)?.total_pages ?? 1} ({(localData || message.result_data)?.total_rows ?? 0} rows total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(((localData || message.result_data)?.page ?? 1) - 1)}
                    disabled={((localData || message.result_data)?.page ?? 1) <= 1 || isLoadingData}
                    className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] disabled:opacity-30 border transition-all text-xs flex items-center gap-1 px-2.5 py-1"
                    style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
                  >
                    <ChevronLeft size={14} />
                    Prev
                  </button>
                  <button
                    onClick={() => handlePageChange(((localData || message.result_data)?.page ?? 1) + 1)}
                    disabled={((localData || message.result_data)?.page ?? 1) >= ((localData || message.result_data)?.total_pages ?? 1) || isLoadingData}
                    className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] disabled:opacity-30 border transition-all text-xs flex items-center gap-1 px-2.5 py-1"
                    style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
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
          onCopy={onCopy}
          onCopyTable={handleCopyTable}
        />
      </div>
    </div>
  );
}
