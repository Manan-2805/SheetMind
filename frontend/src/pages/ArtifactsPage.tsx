import { useCallback, useEffect, useState } from "react";
import { Download, LineChart, Trash2, X, Check } from "lucide-react";

import {
    deleteArtifact,
    downloadArtifact,
    getArtifactData,
    getArtifacts,
    renameArtifact,
} from "@/api/artifactsApi";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { QueryResultPanel } from "@/components/QueryResultPanel";
import { useToast } from "@/hooks/useToast";
import type { ArtifactExport } from "@/types/Artifact";
import type { ResultTable } from "@/types/ChatMessage";
import { formatAbsoluteDate, formatFileSize } from "@/utils/formatDate";

interface ArtifactResult {
    title: string;
    subtitle?: string;
    result: ResultTable;
}

export function ArtifactsPage() {
    const { addToast } = useToast();
    const [exports, setExports] = useState<ArtifactExport[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [activeResult, setActiveResult] = useState<ArtifactResult | null>(null);
    const [loadingChartId, setLoadingChartId] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [previewArtifact, setPreviewArtifact] = useState<{ id: string; title: string; filename: string } | null>(null);

    const loadArtifacts = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getArtifacts();
            setExports(data.excel_exports);
        } catch (err: unknown) {
            const e = err as { message?: string };
            addToast({ type: "error", title: "Error", description: e?.message });
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => { 
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadArtifacts(); 
    }, [loadArtifacts]);

    const startRename = (artifact: ArtifactExport) => {
        setEditingId(artifact.id);
        setEditingTitle(artifact.title);
    };

    const cancelRename = () => {
        setEditingId(null);
        setEditingTitle("");
    };

    const confirmRename = async (artifact: ArtifactExport) => {
        if (!editingTitle.trim()) return;
        try {
            const updated = await renameArtifact(artifact.id, editingTitle.trim());
            setExports((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            cancelRename();
            addToast({ type: "success", title: "Renamed", description: "Artifact title updated" });
        } catch (err: unknown) {
            const e = err as { message?: string };
            addToast({ type: "error", title: "Error", description: e?.message });
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteArtifact(deleteId);
            setExports((prev) => prev.filter((a) => a.id !== deleteId));
            addToast({ type: "success", title: "Deleted", description: "Artifact removed" });
        } catch (err: unknown) {
            const e = err as { message?: string };
            addToast({ type: "error", title: "Error", description: e?.message });
        } finally {
            setDeleteId(null);
        }
    };

    const handleGenerateChart = async (artifact: ArtifactExport) => {
        setLoadingChartId(artifact.id);
        try {
            const result = await getArtifactData(artifact.id);
            setActiveResult({
                title: artifact.title,
                subtitle: artifact.filename,
                result,
            });
        } catch (err: unknown) {
            const e = err as { message?: string };
            addToast({ type: "error", title: "Error", description: e?.message });
        } finally {
            setLoadingChartId(null);
        }
    };

    const handleDownload = async (artifact: ArtifactExport) => {
        setDownloadingId(artifact.id);
        try {
            await downloadArtifact(artifact.id, artifact.filename);
        } catch (err: unknown) {
            const e = err as { message?: string };
            addToast({ type: "error", title: "Error", description: e?.message || "Failed to download artifact" });
        } finally {
            setDownloadingId(null);
        }
    };

    const handlePreview = (artifact: ArtifactExport) => {
        setPreviewArtifact({ id: artifact.id, title: artifact.title, filename: artifact.filename });
    };

    return (
        <div className="flex h-full flex-col overflow-y-auto scrollbar-thin" style={{ backgroundColor: "var(--color-bg-base)" }}>
            <div className="mx-auto w-full max-w-6xl px-6 py-8">
                <div
                    className="mb-6 rounded-2xl p-6"
                    style={{
                        background: "radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 60%), var(--color-bg-elevated)",
                        border: "1px solid var(--color-border-default)",
                    }}
                >
                    <h1 className="text-page-heading" style={{ color: "var(--color-text-primary)" }}>
                        Artifacts
                    </h1>
                    <p className="text-body mt-1" style={{ color: "var(--color-text-tertiary)" }}>
                        Access every Excel export and spin up new charts instantly.
                    </p>
                </div>

                {isLoading ? (
                    <p className="text-body" style={{ color: "var(--color-text-tertiary)" }}>Loading...</p>
                ) : exports.length === 0 ? (
                    <div
                        className="rounded-xl p-6 text-center text-body"
                        style={{ border: "1px dashed var(--color-border-default)", color: "var(--color-text-tertiary)" }}
                    >
                        No exports yet. Run a query and export to Excel to see it here.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {exports.map((artifact) => {
                            const isEditing = editingId === artifact.id;
                            const isLoadingChart = loadingChartId === artifact.id;
                            return (
                                <div
                                    key={artifact.id}
                                    className="rounded-2xl p-5"
                                    style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)" }}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        value={editingTitle}
                                                        onChange={(e) => setEditingTitle(e.target.value)}
                                                        className="w-full rounded-lg px-3 py-2 text-body outline-none"
                                                        style={{ backgroundColor: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-primary)" }}
                                                    />
                                                    <button
                                                        onClick={() => confirmRename(artifact)}
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
                                                <p className="text-body-em truncate" style={{ color: "var(--color-text-primary)" }}>
                                                    {artifact.title}
                                                </p>
                                            )}
                                            <p className="text-body mt-2" style={{ color: "var(--color-text-secondary)" }}>
                                                {artifact.filename}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                onClick={() => handleDownload(artifact)}
                                                disabled={downloadingId === artifact.id}
                                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-em transition-all duration-[120ms]"
                                                style={{ backgroundColor: "var(--color-bg-hover)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-default)", opacity: downloadingId === artifact.id ? 0.7 : 1 }}
                                            >
                                                <Download size={14} />
                                                {downloadingId === artifact.id ? "..." : "Download"}
                                            </button>
                                            <button
                                                onClick={() => handlePreview(artifact)}
                                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-em transition-all duration-[120ms]"
                                                style={{ backgroundColor: "var(--color-bg-hover)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-default)" }}
                                            >
                                                Preview
                                            </button>
                                            <button
                                                onClick={() => handleGenerateChart(artifact)}
                                                disabled={isLoadingChart}
                                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-em transition-all duration-[120ms]"
                                                style={{ backgroundColor: "var(--color-accent)", color: "#fff", opacity: isLoadingChart ? 0.7 : 1 }}
                                            >
                                                <LineChart size={14} />
                                                {isLoadingChart ? "Loading..." : "Generate chart"}
                                            </button>
                                            {!isEditing && (
                                                <button
                                                    onClick={() => startRename(artifact)}
                                                    className="rounded-lg px-3 py-2 text-body-em"
                                                    style={{ border: "1px solid var(--color-border-default)", color: "var(--color-text-secondary)" }}
                                                >
                                                    Rename
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setDeleteId(artifact.id)}
                                                className="rounded-lg px-3 py-2 text-body-em"
                                                style={{ border: "1px solid var(--color-border-default)", color: "var(--color-text-tertiary)" }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-3 text-ui-label" style={{ color: "var(--color-text-tertiary)" }}>
                                        <span>{formatFileSize(artifact.file_size_bytes)}</span>
                                        <span>Created {formatAbsoluteDate(artifact.created_at)}</span>
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
                title="Delete artifact"
                description="This will remove the export file from disk."
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={handleDelete}
            />

            <QueryResultPanel
                open={activeResult !== null}
                onClose={() => setActiveResult(null)}
                title={activeResult?.title ?? ""}
                subtitle={activeResult?.subtitle}
                result={activeResult?.result ?? null}
            />

            {previewArtifact && (
                <ArtifactPreviewModal
                    open={!!previewArtifact}
                    onClose={() => setPreviewArtifact(null)}
                    artifact={previewArtifact}
                />
            )}
        </div>
    );
}

// Separate component for the preview modal to keep the main component clean
import { ExcelPreviewGrid } from "@/components/ExcelPreviewGrid";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

function ArtifactPreviewModal({ open, onClose, artifact }: { open: boolean, onClose: () => void, artifact: { id: string; title: string; filename: string } | null }) {
    const { addToast } = useToast();
    const [result, setResult] = useState<ResultTable | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !artifact) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        getArtifactData(artifact.id)
            .then(setResult)
            .catch((err: unknown) => {
                const e = err as { message?: string };
                addToast({ type: "error", title: "Error", description: e?.message || "Failed to load artifact data" });
            })
            .finally(() => setLoading(false));
    }, [open, artifact, addToast]);

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
            <DialogContent
                className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] flex flex-col p-6"
                style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)" }}
            >
                <DialogHeader className="flex-none">
                    <DialogTitle style={{ color: "var(--color-text-primary)" }}>{artifact?.title || "Artifact Preview"}</DialogTitle>
                    <DialogDescription style={{ color: "var(--color-text-tertiary)" }}>{artifact?.filename}</DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 mt-4 border rounded-xl overflow-hidden" style={{ borderColor: "var(--color-border-default)" }}>
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center text-body" style={{ color: "var(--color-text-tertiary)" }}>Loading preview...</div>
                    ) : result ? (
                        <ExcelPreviewGrid result={result} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-body" style={{ color: "var(--color-text-tertiary)" }}>Failed to load data</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
