import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Play, Search, Star, X } from "lucide-react";

import {
    deleteSavedQuery,
    exportSavedQuery,
    renameSavedQuery,
    runSavedQuery,
    searchSavedQueries,
    toggleFavorite,
} from "@/api/savedQueriesApi";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { QueryResultPanel } from "@/components/QueryResultPanel";
import { ExcelPreviewGrid } from "@/components/ExcelPreviewGrid";
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
        const handle = setTimeout(() => { void loadQueries(); }, 250);
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

    const handleRun = async (query: SavedQuery) => {
        setRunningId(query.id);
        try {
            const res = await runSavedQuery(query.id);
            setActiveResult(res);
            setChartModalOpen(false);
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
            addToast({ type: "success", title: "Exported", description: "Excel file saved to artifacts" });
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
                className="w-full lg:w-[400px] xl:w-[450px] h-[350px] lg:h-full flex-shrink-0 flex flex-col overflow-y-auto scrollbar-thin"
                style={{ borderRight: "1px solid var(--color-border-default)" }}
            >
                <div className="p-6">
                    <div
                        className="mb-6 rounded-2xl p-5"
                        style={{
                            background: "linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-base) 100%)",
                            border: "1px solid var(--color-border-default)",
                        }}
                    >
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-page-heading" style={{ color: "var(--color-text-primary)" }}>
                                        Saved Queries
                                    </h1>
                                    <p className="text-body mt-1 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                                        Manage reusable SQL queries.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setFavoriteOnly((prev) => !prev)}
                                    className="rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-[120ms]"
                                    style={{
                                        backgroundColor: favoriteOnly ? "var(--color-accent-subtle)" : "var(--color-bg-hover)",
                                        color: favoriteOnly ? "var(--color-accent)" : "var(--color-text-secondary)",
                                        border: "1px solid var(--color-border-default)",
                                    }}
                                >
                                    {favoriteOnly ? "Favorites" : "All"}
                                </button>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)" }}>
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
                                        style={{ backgroundColor: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-primary)" }}
                                    />
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                                        style={{ backgroundColor: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-primary)" }}
                                    />
                                </div>
                                {(searchText || dateFrom || dateTo) && (
                                    <button
                                        onClick={() => { setSearchText(""); setDateFrom(""); setDateTo(""); }}
                                        className="rounded-xl px-3 py-1.5 text-xs font-medium"
                                        style={{ border: "1px solid var(--color-border-default)", color: "var(--color-text-secondary)", backgroundColor: "transparent" }}
                                    >
                                        Reset Filters
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <p className="text-body text-sm" style={{ color: "var(--color-text-tertiary)" }}>Loading...</p>
                    ) : queries.length === 0 ? (
                        <div
                            className="rounded-xl p-6 text-center text-sm"
                            style={{ border: "1px dashed var(--color-border-default)", color: "var(--color-text-tertiary)" }}
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
                                            backgroundColor: isActive ? "var(--color-bg-hover)" : "var(--color-bg-elevated)",
                                            border: isActive ? "1px solid var(--color-accent)" : "1px solid var(--color-border-default)",
                                        }}
                                    >
                                        <div className="flex flex-col gap-3">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        value={editingLabel}
                                                        onChange={(e) => setEditingLabel(e.target.value)}
                                                        className="w-full rounded-lg px-2 py-1 text-sm outline-none"
                                                        style={{ backgroundColor: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-primary)" }}
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
                                                        style={{ border: "1px solid var(--color-border-default)", color: "var(--color-text-secondary)" }}
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
                                                                style={{ color: query.is_favorite ? "var(--color-accent)" : "var(--color-text-tertiary)" }}
                                                            >
                                                                <Star size={14} fill={query.is_favorite ? "currentColor" : "none"} />
                                                            </button>
                                                            <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                                                                {query.label}
                                                            </p>
                                                        </div>
                                                        <p
                                                            className="text-xs mt-1"
                                                            style={{ color: "var(--color-text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                                                        >
                                                            {query.nl_query}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between mt-1">
                                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--color-text-tertiary)" }}>
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
                                                        onClick={() => handleRun(query)}
                                                        disabled={runningId === query.id}
                                                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                                                        style={{ backgroundColor: "var(--color-accent)", color: "#fff", opacity: runningId === query.id ? 0.7 : 1 }}
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
                {activeResult ? (
                    <div className="flex-1 flex flex-col p-6 overflow-hidden">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>{activeResult.label}</h2>
                                <p className="text-sm mt-1" style={{ color: "var(--color-text-tertiary)" }}>{activeResult.nl_query}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setChartModalOpen(true)}
                                    className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-[120ms]"
                                    style={{ border: "1px solid var(--color-border-default)", backgroundColor: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}
                                >
                                    Build Chart
                                </button>
                                <button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-[120ms]"
                                    style={{ backgroundColor: "var(--color-accent)", color: "#fff", opacity: isExporting ? 0.7 : 1 }}
                                >
                                    {isExporting ? "Exporting..." : "Export Excel"}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border-default)" }}>
                            <ExcelPreviewGrid result={activeResult.result} />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)" }}>
                                <Play size={24} style={{ color: "var(--color-text-tertiary)" }} />
                            </div>
                            <p className="text-lg font-medium" style={{ color: "var(--color-text-secondary)" }}>No Query Selected</p>
                            <p className="text-sm mt-1" style={{ color: "var(--color-text-tertiary)" }}>Run a saved query from the left panel to see results</p>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => { if (!open) setDeleteId(null); }}
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
