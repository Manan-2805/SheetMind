import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

import type { ResultTable } from "@/types/ChatMessage";

interface ChatResultTableProps {
  data: ResultTable;
}

type SortDirection = "asc" | "desc" | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

export function ChatResultTable({ data }: ChatResultTableProps) {
  const [sort, setSort] = useState<SortState>({ column: null, direction: null });

  const handleSort = (colKey: string) => {
    setSort((prev) => {
      if (prev.column === colKey) {
        if (prev.direction === "asc") return { column: colKey, direction: "desc" };
        if (prev.direction === "desc") return { column: null, direction: null };
      }
      return { column: colKey, direction: "asc" };
    });
  };

  const sortedRows = useMemo(() => {
    if (!sort.column || !sort.direction) return data.rows;
    return [...data.rows].sort((a, b) => {
      const aVal = a[sort.column!];
      const bVal = b[sort.column!];
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [data.rows, sort]);

  const visibleRows = sortedRows;
  const hasMore = data.total_rows > visibleRows.length;

  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{ border: "1px solid var(--color-border-default)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-body" style={{ tableLayout: "auto" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-bg-hover)" }}>
              {data.columns.map((col) => {
                const isSorted = sort.column === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="cursor-pointer select-none px-3 py-2 text-left text-ui-label uppercase transition-colors duration-[120ms]"
                    style={{
                      color: isSorted
                        ? "var(--color-text-primary)"
                        : "var(--color-text-tertiary)",
                      borderBottom: "1px solid var(--color-border-default)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {isSorted && sort.direction === "asc" && (
                        <ChevronUp size={11} />
                      )}
                      {isSorted && sort.direction === "desc" && (
                        <ChevronDown size={11} />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, ri) => (
              <tr
                key={ri}
                style={{
                  backgroundColor:
                    ri % 2 === 0
                      ? "var(--color-bg-elevated)"
                      : "var(--color-bg-hover)",
                }}
              >
                {data.columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 py-2"
                    style={{
                      color: "var(--color-text-primary)",
                      borderBottom: "1px solid var(--color-border-subtle)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {typeof row[col.key] === "number"
                      ? typeof row[col.key] === "number" &&
                        String(row[col.key]).includes(".")
                        ? Number(row[col.key]).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                        : Number(row[col.key]).toLocaleString()
                      : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div
          className="px-3 py-2 text-ui-label"
          style={{
            color: "var(--color-text-tertiary)",
            borderTop: "1px solid var(--color-border-default)",
            backgroundColor: "var(--color-bg-hover)",
          }}
        >
          Showing {visibleRows.length} of {data.total_rows} rows
        </div>
      )}
    </div>
  );
}
