import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Play, Trash2 } from "lucide-react";

import {
  deleteSavedQuery,
  getSavedQueries,
  runSavedQuery,
} from "@/api/savedQueriesApi";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/skeletons/SkeletonCard";
import { useToast } from "@/hooks/useToast";
import type { SavedQuery } from "@/types/SavedQuery";
import { formatAbsoluteDate } from "@/utils/formatDate";

interface SavedQueriesDrawerProps {
  open: boolean;
  onClose: () => void;
  onRunQuery: (nlQuery: string) => void;
}

export function SavedQueriesDrawer({
  open,
  onClose,
  onRunQuery,
}: SavedQueriesDrawerProps) {
  const { addToast } = useToast();
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSql, setExpandedSql] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!open) return;
    setIsLoading(true);
    try {
      const data = await getSavedQueries();
      setQueries(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
    } finally {
      setIsLoading(false);
    }
  }, [open, addToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const handleRun = async (query: SavedQuery) => {
    try {
      const res = await runSavedQuery(query.id);
      onRunQuery(res.inserted_query);
      onClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSavedQuery(id);
      setQueries((prev) => prev.filter((q) => q.id !== id));
      addToast({ type: "success", title: "Query deleted" });
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
    }
  };

  const toggleSql = (id: string) => {
    setExpandedSql((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Drawer open={open} onClose={onClose} side="left" width={320}>
      <div className="flex h-full flex-col">
        <div
          className="px-4 py-3"
          style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
        >
          <p className="text-panel-heading" style={{ color: "var(--color-text-primary)" }}>
            Saved Queries
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} height="100px" />
              ))}
            </div>
          ) : queries.length === 0 ? (
            <p
              className="py-8 text-center text-body"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              No saved queries yet
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {queries.map((q) => {
                const isSqlOpen = expandedSql.has(q.id);
                return (
                  <div
                    key={q.id}
                    className="rounded-xl p-3"
                    style={{
                      backgroundColor: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border-default)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-body-em truncate"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {q.label}
                        </p>
                        <p
                          className="mt-0.5 text-body"
                          style={{
                            color: "var(--color-text-secondary)",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {q.nl_query}
                        </p>
                      </div>
                      <Badge variant="accent">{q.use_count}×</Badge>
                    </div>

                    <p
                      className="mt-1.5 text-ui-label"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      Last used {formatAbsoluteDate(q.last_used_at)}
                    </p>

                    <button
                      onClick={() => toggleSql(q.id)}
                      className="mt-2 flex items-center gap-1 text-ui-label transition-colors duration-[120ms]"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {isSqlOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      {"{ } View SQL"}
                    </button>

                    {isSqlOpen && (
                      <pre
                        className="mt-2 overflow-x-auto rounded-lg p-2 text-code scrollbar-thin"
                        style={{
                          backgroundColor: "var(--color-bg-hover)",
                          border: "1px solid var(--color-border-subtle)",
                          color: "var(--color-text-secondary)",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                        }}
                      >
                        {q.sql_query}
                      </pre>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleRun(q)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-body-em transition-all duration-[120ms] active:scale-[0.97]"
                        style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
                      >
                        <Play size={12} />
                        Run
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="rounded-lg p-1.5 transition-colors duration-[120ms]"
                        style={{ color: "var(--color-text-tertiary)" }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = "var(--color-destructive)"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-tertiary)"}
                        aria-label="Delete query"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
