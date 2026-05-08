import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Play, Search, Star, Trash2, X } from "lucide-react";

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
            className="flex h-full flex-col overflow-y-auto scrollbar-thin"
            style={{ backgroundColor: "var(--color-bg-base)" }}
        >
            <div className="mx-auto w-full max-w-6xl px-6 py-8">
                <div
                    className="mb-6 rounded-2xl p-6"
                    style={{
                        background: "linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-base) 100%)",
                        border: "1px solid var(--color-border-default)",
                    }}
                >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-page-heading" style={{ color: "var(--color-text-primary)" }}>
                                Saved Queries
                            </h1>
                            <p className="text-body mt-1" style={{ color: "var(--color-text-tertiary)" }}>
                                Search, run, and manage your reusable SQL queries.
                            </p>
                        </div>
                        <button
                            onClick={() => setFavoriteOnly((prev) => !prev)}
                            className="rounded-full px-4 py-2 text-body-em transition-all duration-[120ms]"
                            style={{
                                backgroundColor: favoriteOnly ? "var(--color-accent-subtle)" : "var(--color-bg-hover)",
                                color: favoriteOnly ? "var(--color-accent)" : "var(--color-text-secondary)",
                                border: "1px solid var(--color-border-default)",
                            }}
                        >
                            {favoriteOnly ? "Showing favorites" : "All queries"}
                        </button>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
                        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)" }}>
                            <Search size={16} style={{ color: "var(--color-text-tertiary)" }} />
                            <input
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Search by label or query text"
                                className="w-full bg-transparent text-body outline-none"
                                style={{ color: "var(--color-text-primary)" }}
                            />
                        </div>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="rounded-xl px-3 py-2 text-body outline-none"
                            style={{ backgroundColor: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-primary)" }}
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="rounded-xl px-3 py-2 text-body outline-none"
                            style={{ backgroundColor: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-primary)" }}
                        />
                        <button
                            onClick={() => { setSearchText(""); setDateFrom(""); setDateTo(""); }}
                            className="rounded-xl px-3 py-2 text-body-em"
                            style={{ border: "1px solid var(--color-border-default)", color: "var(--color-text-secondary)", backgroundColor: "transparent" }}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <p className="text-body" style={{ color: "var(--color-text-tertiary)" }}>Loading...</p>
                ) : queries.length === 0 ? (
                    <div
                        className="rounded-xl p-6 text-center text-body"
                        style={{ border: "1px dashed var(--color-border-default)", color: "var(--color-text-tertiary)" }}
                    >
                        No saved queries found.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {queries.map((query) => {
                            const isEditing = editingId === query.id;
                            return (
                                <div
                                    key={query.id}
                                    className="rounded-2xl p-5"
                                    style={{
                                        backgroundColor: "var(--color-bg-elevated)",
                                        border: "1px solid var(--color-border-default)",
                                    }}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        value={editingLabel}
                                                        onChange={(e) => setEditingLabel(e.target.value)}
                                                        className="w-full rounded-lg px-3 py-2 text-body outline-none"
                                                        style={{ backgroundColor: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-primary)" }}
                                                    />
                                                    <button
                                                        onClick={() => confirmRename(query)}
                                                        className="rounded-lg p-2"
                                                        style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
                                                        aria-label="Save"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        onClick={cancelRename}
                                                        className="rounded-lg p-2"
                                                        style={{ border: "1px solid var(--color-border-default)", color: "var(--color-text-secondary)" }}
                                                        aria-label="Cancel"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleFavorite(query)}
                                                        className="rounded-full p-1"
                                                        style={{ color: query.is_favorite ? "var(--color-accent)" : "var(--color-text-tertiary)" }}
                                                        aria-label="Toggle favorite"
                                                    >
                                                        <Star size={16} fill={query.is_favorite ? "currentColor" : "none"} />
                                                    </button>
                                                    <p className="text-body-em truncate" style={{ color: "var(--color-text-primary)" }}>
                                                        {query.label}
                                                    </p>
                                                </div>
                                            )}
                                            <p
                                                className="text-body mt-2"
                                                style={{ color: "var(--color-text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                                            >
                                                {query.nl_query}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleRun(query)}
                                                disabled={runningId === query.id}
                                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-em transition-all duration-[120ms]"
                                                style={{ backgroundColor: "var(--color-accent)", color: "#fff", opacity: runningId === query.id ? 0.7 : 1 }}
                                            >
                                                <Play size={14} />
                                                {runningId === query.id ? "Running..." : "Run"}
                                            </button>
                                            {!isEditing && (
                                                <button
                                                    onClick={() => startRename(query)}
                                                    className="rounded-lg px-3 py-2 text-body-em"
                                                    style={{ border: "1px solid var(--color-border-default)", color: "var(--color-text-secondary)" }}
                                                >
                                                    Rename
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setDeleteId(query.id)}
                                                className="rounded-lg px-3 py-2 text-body-em"
                                                style={{ border: "1px solid var(--color-border-default)", color: "var(--color-text-tertiary)" }}
                                                aria-label="Delete query"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-3 text-ui-label" style={{ color: "var(--color-text-tertiary)" }}>
                                        <span>Created {formatAbsoluteDate(query.created_at)}</span>
                                        <span>Last used {formatAbsoluteDate(query.last_used_at)}</span>
                                        <span>{query.use_count} runs</span>
                                    </div>
                                </div>
                            );
                        })}
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
                open={activeResult !== null}
                onClose={() => setActiveResult(null)}
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
