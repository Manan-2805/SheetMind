import { ArrowUp, Sparkles } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { PendingChange } from "@/types/ExcelEditor";
import { EditorChangeStack } from "./EditorChangeStack";
import { EditorDiffTable } from "./EditorDiffTable";

interface EditorAIPanelProps {
  changeStack: PendingChange[];
  selectedChangeId: string | null;
  onSelectChange: (id: string | null) => void;
  onAcceptChange: (id: string) => void;
  onRejectChange: (id: string) => void;
  onSubmitPrompt: (prompt: string) => void;
  isGenerating: boolean;
  activeSheetName: string;
}

export function EditorAIPanel({
  changeStack,
  selectedChangeId,
  onSelectChange,
  onAcceptChange,
  onRejectChange,
  onSubmitPrompt,
  isGenerating,
  activeSheetName,
}: EditorAIPanelProps) {
  const [prompt, setPrompt] = useState("");

  const selectedChange = changeStack.find((c) => c.changeId === selectedChangeId);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onSubmitPrompt(prompt);
    setPrompt("");
  };

  const suggestions = [
    "Remove duplicate rows",
    "Fill empty cells in column B with 0",
    "Add a TotalPrice column = Quantity * UnitPrice",
  ];

  return (
    <div className="flex flex-col h-full bg-bg-base overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Change Stack */}
        <EditorChangeStack
          changes={changeStack}
          selectedId={selectedChangeId}
          onSelect={(id) => onSelectChange(id)}
        />

        {/* Center: Diff View or Empty State */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedChange ? (
            <EditorDiffTable
              change={selectedChange}
              onAccept={() => onAcceptChange(selectedChange.changeId)}
              onReject={() => onRejectChange(selectedChange.changeId)}
              onContinue={() => onSelectChange(null)}
              onRestore={() => {
                onSubmitPrompt(selectedChange.promptText);
                onSelectChange(null);
              }}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center opacity-60">
              <Sparkles className="h-10 w-10 text-accent mb-4 opacity-40" />
              <p className="text-sm font-medium">
                {changeStack.length > 0
                  ? "Select a change from the stack to review it."
                  : "No changes yet. Describe a modification below."}
              </p>
              <p className="text-xs text-tertiary mt-1">
                Use natural language to clean data, add formulas, or transform columns.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Prompt Input Bar */}
      <div className="border-t border-border-default p-3 bg-bg-elevated/30">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          <div className="flex items-center pointer-events-none  gap-2">
            <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold text-accent border border-accent/20 uppercase tracking-tight">
              Editing: {activeSheetName}
            </span>
            {/* Suggestion Chips */}
            {!isGenerating && !selectedChangeId && (
              <div className="flex gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(s)}
                    onDoubleClick={() => {
                      setPrompt(s);
                      onSubmitPrompt(s);
                    }}
                    className="px-2.5 py-1 rounded-full bg-bg-hover border border-border-default text-[10px] hover:border-accent hover:text-accent transition-all whitespace-nowrap"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Describe a modification to this sheet..."
                disabled={isGenerating}
                className="w-full rounded-xl bg-bg-base pl-3 pr-12 py-3 text-sm border border-border-default outline-none focus:border-accent transition-colors resize-none overflow-hidden"
                rows={1}
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />
              <button
                onClick={handleSubmit}
                disabled={isGenerating || !prompt.trim()}
                className="absolute right-1.5 bottom-3 h-8 w-8 flex items-center justify-center rounded-lg bg-accent text-white shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100"
              >
                {isGenerating ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
