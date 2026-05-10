import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import type { AutocompleteFile } from "@/types/DataSource";

interface FileAutocompleteProps {
  triggerIndex: number;
  query: string;
  files: AutocompleteFile[];
  onSelect: (value: string) => void;
  onDismiss: () => void;
  anchorRef: React.RefObject<HTMLTextAreaElement | null>;
}

interface FlatItem {
  type: "file" | "sheet";
  label: string;
  insertValue: string;
  parentFile?: string;
}

export function FileAutocomplete({
  query,
  files,
  onSelect,
  onDismiss,
}: FileAutocompleteProps) {
  const [internalQuery, setInternalQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Combine trigger query and internal search
  const activeQuery = internalQuery || query;

  const flatItems: FlatItem[] = useMemo(() => {
    return files
      .flatMap((f) => {
        const fileItem: FlatItem = {
          type: "file",
          label: f.filename,
          insertValue: f.filename,
        };
        const sheetItems: FlatItem[] = f.sheets.map((s) => ({
          type: "sheet",
          label: `${f.filename} (${s})`,
          insertValue: `${f.filename}::${s}`,
          parentFile: f.filename,
        }));
        return [fileItem, ...sheetItems];
      })
      .filter((item) =>
        activeQuery.length === 0 ||
        item.label.toLowerCase().includes(activeQuery.toLowerCase())
      );
  }, [files, activeQuery]);

  const handleSelect = useCallback(
    (item: FlatItem) => {
      onSelect(item.insertValue);
    },
    [onSelect]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0);
  }, [flatItems.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((p) => Math.min(p + 1, flatItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((p) => Math.max(p - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems[selectedIndex]) handleSelect(flatItems[selectedIndex]);
      } else if (e.key === "Escape") {
        onDismiss();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [flatItems, selectedIndex, handleSelect, onDismiss]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onDismiss();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onDismiss]);

  useEffect(() => {
    // Focus search input on mount
    searchInputRef.current?.focus();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute z-50 flex flex-col overflow-hidden rounded-lg shadow-xl"
      style={{
        bottom: "calc(100% + 8px)",
        left: 0,
        right: 0,
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-default)",
        maxHeight: 300,
      }}
    >
      <div 
        className="flex items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: "var(--color-border-default)" }}
      >
        <Search size={14} style={{ color: "var(--color-text-tertiary)" }} />
        <input
          ref={searchInputRef}
          type="text"
          value={internalQuery}
          onChange={(e) => setInternalQuery(e.target.value)}
          placeholder="Search files or sheets..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--color-text-primary)" }}
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {flatItems.length === 0 ? (
          <div 
            className="px-4 py-3 text-center text-sm"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            No matches found
          </div>
        ) : (
          flatItems.map((item, i) => (
            <button
              key={item.insertValue}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-body transition-colors duration-[120ms]"
              style={{
                backgroundColor:
                  i === selectedIndex
                    ? "var(--color-bg-hover)"
                    : "transparent",
                color: "var(--color-text-primary)",
              }}
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => handleSelect(item)}
            >
              {item.type === "file" ? (
                <span
                  className="text-ui-label font-semibold"
                  style={{ color: "var(--color-accent)" }}
                >
                  #
                </span>
              ) : (
                <span
                  className="text-ui-label"
                  style={{ color: "var(--color-text-tertiary)", marginLeft: 8 }}
                >
                  ↳
                </span>
              )}
              <span 
                className="truncate"
                style={{ 
                  color: item.type === "file" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  fontWeight: item.type === "file" ? 500 : 400
                }}
              >
                {item.label}
              </span>
              {item.type === "file" && (
                <span
                  className="ml-auto text-[10px] uppercase tracking-wider"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Excel
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
