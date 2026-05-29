import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  Play,
  Search,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  deleteSavedQuery,
  exportSavedQuery,
  renameSavedQuery,
  runSavedQuery,
  searchSavedQueries,
  toggleFavorite,
} from "@/api/savedQueriesApi";
import { ExcelPreviewGrid } from "@/components/ExcelPreviewGrid";
import { QueryResultPanel } from "@/components/QueryResultPanel";
import { SkeletonQueryCard } from "@/components/skeletons/SkeletonQueryCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import type { ResultTable } from "@/types/ChatMessage";
import type { SavedQuery } from "@/types/SavedQuery";
import { formatAbsoluteDate } from "@/utils/formatDate";

interface RunResult {
  id: string;
  label: string;
  nl_query: string;
  sql_query: string;
  result: ResultTable;
}

export function SavedQueriesPage() {
  const { addToast } = useToast();
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<RunResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [chartModalOpen, setChartModalOpen] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filters = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (to) to.setHours(23, 59, 59, 999);
    return {
      query: searchText.trim() || undefined,
      from: from ? from.toISOString() : undefined,
      to: to ? to.toISOString() : undefined,
    };
  }, [searchText, dateFrom, dateTo]);

  const loadQueries = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await searchSavedQueries(filters.query, filters.from, filters.to);
      setQueries(favoriteOnly ? data.filter((q) => q.is_favorite) : data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
    } finally {
      setIsLoading(false);
    }
  }, [addToast, filters, favoriteOnly]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void loadQueries();
    }, 250);
    return () => clearTimeout(handle);
  }, [loadQueries]);

  const startRename = (query: SavedQuery) => {
    setEditingId(query.id);
    setEditingLabel(query.label);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingLabel("");
  };

  const confirmRename = async (query: SavedQuery) => {
    if (!editingLabel.trim()) return;
    try {
      const updated = await renameSavedQuery(query.id, editingLabel.trim());
      setQueries((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      cancelRename();
      addToast({ type: "success", title: "Renamed", description: "Label updated" });
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
    }
  };

  const handleToggleFavorite = async (query: SavedQuery) => {
    try {
      const updated = await toggleFavorite(query.id);
      setQueries((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSavedQuery(deleteId);
      setQueries((prev) => prev.filter((q) => q.id !== deleteId));
      addToast({ type: "success", title: "Deleted", description: "Saved query removed" });
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
    } finally {
      setDeleteId(null);
    }
  };

  const handleRun = async (query: SavedQuery, page: number = 1, size: number = pageSize) => {
    setRunningId(query.id);
    setCurrentPage(page);
    setPageSize(size);
    try {
      const res = await runSavedQuery(query.id, page, size);
      setActiveResult(res);
      setChartModalOpen(false);
      // Update run count and last_used_at in local state
      setQueries((prev) =>
        prev.map((q) =>
          q.id === query.id
            ? { ...q, use_count: q.use_count + 1, last_used_at: new Date().toISOString() }
            : q
        )
      );
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
    } finally {
      setRunningId(null);
    }
  };

  const handleExport = async () => {
    if (!activeResult || isExporting) return;
    setIsExporting(true);
    try {
      await exportSavedQuery(activeResult.id);
      addToast({
        type: "success",
        title: "Exported",
        description: "Excel file saved to artifacts",
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="flex h-full flex-col lg:flex-row overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-base)" }}
    >
      {/* Left Panel: Filters and List */}
      <div
        className={`h-[350px] lg:h-full flex-shrink-0 flex flex-col overflow-y-auto scrollbar-thin transition-all duration-300 ${
          isSidebarCollapsed
            ? "w-0 lg:w-0 overflow-hidden border-none"
            : "w-full lg:w-[400px] xl:w-[450px]"
        }`}
        style={{
          borderRight: isSidebarCollapsed ? "none" : "1px solid var(--color-border-default)",
          display: isSidebarCollapsed ? "none" : "flex",
        }}
      >
        <div className="p-6">
          <div
            className="mb-6 rounded-2xl p-5"
            style={{
              background:
                "linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-base) 100%)",
              border: "1px solid var(--color-border-default)",
            }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-page-heading" style={{ color: "var(--color-text-primary)" }}>
                    Saved Queries
                  </h1>
                  <p
                    className="text-body mt-1 text-sm"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Manage reusable SQL queries.
                  </p>
                </div>
                <button
                  onClick={() => setFavoriteOnly((prev) => !prev)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-[120ms]"
                  style={{
                    backgroundColor: favoriteOnly
                      ? "var(--color-accent-subtle)"
                      : "var(--color-bg-hover)",
                    color: favoriteOnly ? "var(--color-accent)" : "var(--color-text-secondary)",
                    border: "1px solid var(--color-border-default)",
                  }}
                >
                  {favoriteOnly ? "Favorites" : "All"}
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{
                    backgroundColor: "var(--color-bg-hover)",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <Search size={14} style={{ color: "var(--color-text-tertiary)" }} />
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-transparent text-sm outline-none"
                    style={{ color: "var(--color-text-primary)" }}
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={{
                      backgroundColor: "var(--color-bg-hover)",
                      border: "1px solid var(--color-border-subtle)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={{
                      backgroundColor: "var(--color-bg-hover)",
                      border: "1px solid var(--color-border-subtle)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>
                {(searchText || dateFrom || dateTo) && (
                  <button
                    onClick={() => {
                      setSearchText("");
                      setDateFrom("");
                      setDateTo("");
                    }}
                    className="rounded-xl px-3 py-1.5 text-xs font-medium"
                    style={{
                      border: "1px solid var(--color-border-default)",
                      color: "var(--color-text-secondary)",
                      backgroundColor: "transparent",
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonQueryCard key={i} />
              ))}
            </div>
          ) : queries.length === 0 ? (
            <div
              className="rounded-xl p-6 text-center text-sm"
              style={{
                border: "1px dashed var(--color-border-default)",
                color: "var(--color-text-tertiary)",
              }}
            >
              No saved queries found.
            </div>
          ) : (
            <div className="grid gap-3">
              {queries.map((query) => {
                const isEditing = editingId === query.id;
                const isActive = activeResult?.id === query.id;
                return (
                  <div
                    key={query.id}
                    className="rounded-xl p-4 transition-all duration-[120ms]"
                    style={{
                      backgroundColor: isActive
                        ? "var(--color-bg-hover)"
                        : "var(--color-bg-elevated)",
                      border: isActive
                        ? "1px solid var(--color-accent)"
                        : "1px solid var(--color-border-default)",
                    }}
                  >
                    <div className="flex flex-col gap-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                            className="w-full rounded-lg px-2 py-1 text-sm outline-none"
                            style={{
                              backgroundColor: "var(--color-bg-hover)",
                              border: "1px solid var(--color-border-subtle)",
                              color: "var(--color-text-primary)",
                            }}
                          />
                          <button
                            onClick={() => confirmRename(query)}
                            className="rounded p-1.5"
                            style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={cancelRename}
                            className="rounded p-1.5"
                            style={{
                              border: "1px solid var(--color-border-default)",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleFavorite(query)}
                                className="rounded-full p-1 -ml-1"
                                style={{
                                  color: query.is_favorite
                                    ? "var(--color-accent)"
                                    : "var(--color-text-tertiary)",
                                }}
                              >
                                <Star
                                  size={14}
                                  fill={query.is_favorite ? "currentColor" : "none"}
                                />
                              </button>
                              <p
                                className="text-sm font-semibold truncate"
                                style={{ color: "var(--color-text-primary)" }}
                              >
                                {query.label}
                              </p>
                            </div>
                            <p
                              className="text-xs mt-1"
                              style={{
                                color: "var(--color-text-secondary)",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {query.nl_query}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-1">
                        <div
                          className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-medium"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          <span>{query.use_count} runs</span>
                          <span>•</span>
                          <span>{formatAbsoluteDate(query.last_used_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {!isEditing && (
                            <button
                              onClick={() => startRename(query)}
                              className="rounded px-2 py-1 text-xs font-medium"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              Rename
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteId(query.id)}
                            className="rounded px-2 py-1 text-xs font-medium"
                            style={{ color: "var(--color-text-tertiary)" }}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleRun(query, 1, pageSize)}
                            disabled={runningId === query.id}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                            style={{
                              backgroundColor: "var(--color-accent)",
                              color: "#fff",
                              opacity: runningId === query.id ? 0.7 : 1,
                            }}
                          >
                            <Play size={12} fill="currentColor" />
                            Run
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Result Table */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--color-bg-base)]">
        {/* Header bar that is always present */}
        <div className="h-14 border-b border-border flex items-center px-6 bg-bg-elevated shrink-0 gap-3 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors"
              style={{
                border: "1px solid var(--color-border-default)",
                backgroundColor: "var(--color-bg-elevated)",
                color: "var(--color-text-secondary)",
              }}
              title={isSidebarCollapsed ? "Expand List" : "Collapse List"}
            >
              <Menu size={16} />
            </button>
            {activeResult && (
              <div className="min-w-0">
                <h2
                  className="text-sm font-semibold truncate"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {activeResult.label}
                </h2>
              </div>
            )}
          </div>
          {activeResult && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartModalOpen(true)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  border: "1px solid var(--color-border-default)",
                  backgroundColor: "var(--color-bg-base)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Build Chart
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "#fff",
                  opacity: isExporting ? 0.7 : 1,
                }}
              >
                {isExporting ? "Exporting..." : "Export Excel"}
              </button>
            </div>
          )}
        </div>

        {activeResult ? (
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="mb-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              Query:{" "}
              <code className="font-mono text-accent bg-bg-hover px-1.5 py-0.5 rounded">
                {activeResult.sql_query}
              </code>
            </div>
            <div
              className="flex-1 overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--color-border-default)" }}
            >
              <ExcelPreviewGrid result={activeResult.result} />
            </div>

            {/* Pagination Footer */}
            <div
              className="mt-4 flex items-center justify-between py-2 text-sm select-none"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <div className="flex items-center gap-2">
                <span>Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    const activeQuery = queries.find((q) => q.id === activeResult.id);
                    if (activeQuery) handleRun(activeQuery, 1, newSize);
                  }}
                  className="bg-bg-elevated border border-border rounded px-2 py-1 outline-none text-xs"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <option value={10}>10 rows</option>
                  <option value={20}>20 rows</option>
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                </select>
                <span className="text-xs text-tertiary">
                  Total: {activeResult.result.total_rows} rows
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const activeQuery = queries.find((q) => q.id === activeResult.id);
                    if (activeQuery) handleRun(activeQuery, 1, pageSize);
                  }}
                  disabled={currentPage === 1 || runningId !== null}
                  className="p-1 rounded hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent"
                  title="First Page"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  onClick={() => {
                    const activeQuery = queries.find((q) => q.id === activeResult.id);
                    if (activeQuery) handleRun(activeQuery, currentPage - 1, pageSize);
                  }}
                  disabled={currentPage === 1 || runningId !== null}
                  className="p-1 rounded hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="mx-2 text-xs font-medium">
                  Page {currentPage} of {activeResult.result.total_pages}
                </span>

                <button
                  onClick={() => {
                    const activeQuery = queries.find((q) => q.id === activeResult.id);
                    if (activeQuery) handleRun(activeQuery, currentPage + 1, pageSize);
                  }}
                  disabled={currentPage === activeResult.result.total_pages || runningId !== null}
                  className="p-1 rounded hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => {
                    const activeQuery = queries.find((q) => q.id === activeResult.id);
                    if (activeQuery)
                      handleRun(activeQuery, activeResult.result.total_pages, pageSize);
                  }}
                  disabled={currentPage === activeResult.result.total_pages || runningId !== null}
                  className="p-1 rounded hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Last Page"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border-default)",
                }}
              >
                <Play size={24} style={{ color: "var(--color-text-tertiary)" }} />
              </div>
              <p className="text-lg font-medium" style={{ color: "var(--color-text-secondary)" }}>
                No Query Selected
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-tertiary)" }}>
                Run a saved query from the left panel to see results
              </p>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete saved query"
        description="This will permanently remove the saved query."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />

      <QueryResultPanel
        open={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        title={activeResult?.label ?? ""}
        subtitle={activeResult?.nl_query}
        result={activeResult?.result ?? null}
        onExport={handleExport}
        exporting={isExporting}
        exportLabel="Export to Excel"
      />
    </div>
  );
}
