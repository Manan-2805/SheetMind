import { useCallback, useEffect, useRef, useState } from "react";

import { listForAutocomplete } from "@/api/dataSourcesApi";
import type { AutocompleteFile } from "@/types/DataSource";

interface FileAutocompleteProps {
  triggerIndex: number;
  query: string;
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
  onSelect,
  onDismiss,
}: FileAutocompleteProps) {
  const [files, setFiles] = useState<AutocompleteFile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listForAutocomplete()
      .then((res) => setFiles(res.files))
      .catch(() => {});
  }, []);

  const flatItems: FlatItem[] = files
    .filter((f) =>
      query.length === 0 ||
      f.filename.toLowerCase().includes(query.toLowerCase())
    )
    .flatMap((f) => [
      { type: "file" as const, label: f.filename, insertValue: f.filename, parentFile: undefined },
      ...f.sheets
        .filter((s) =>
          query.length === 0 || s.toLowerCase().includes(query.toLowerCase())
        )
        .map((s) => ({
          type: "sheet" as const,
          label: s,
          insertValue: `${f.filename}:${s}`,
          parentFile: f.filename,
        })),
    ]);

  const handleSelect = useCallback(
    (item: FlatItem) => {
      onSelect(item.insertValue);
    },
    [onSelect]
  );

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

  if (flatItems.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute z-50 overflow-hidden rounded-lg shadow-xl"
      style={{
        bottom: "calc(100% + 8px)",
        left: 0,
        right: 0,
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-default)",
        maxHeight: 220,
        overflowY: "auto",
      }}
    >
      {flatItems.map((item, i) => (
        <button
          key={item.insertValue}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-body transition-colors duration-[120ms]"
          style={{
            backgroundColor:
              i === selectedIndex
                ? "var(--color-bg-hover)"
                : "transparent",
            color: "var(--color-text-primary)",
            paddingLeft: item.type === "sheet" ? 28 : 12,
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
              style={{ color: "var(--color-text-tertiary)" }}
            >
              ↳
            </span>
          )}
          <span style={{ color: item.type === "file" ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
            {item.label}
          </span>
          {item.type === "file" && (
            <span
              className="ml-auto text-ui-label"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              file
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
