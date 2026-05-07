import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Eye, Trash2, Upload } from "lucide-react";

import {
  deleteDataSource,
  getDataSources,
  getDataSourcePreview,
  uploadFile,
} from "@/api/dataSourcesApi";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SkeletonTable } from "@/components/skeletons/SkeletonTable";
import { ChatResultTable } from "@/components/chat/ChatResultTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import type { DataSource, DataSourcePreview } from "@/types/DataSource";
import { formatAbsoluteDate, formatFileSize } from "@/utils/formatDate";

interface UploadingFile {
  name: string;
  id: string;
}

export function DataSourcesPage() {
  const { addToast } = useToast();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<DataSourcePreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDataSources();
      setSources(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/api/ws/datasources");
    ws.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === "status_update") {
          setSources(prev => prev.map(s => {
            const update = payload.data.find((u: { id: string, status: string, error_message: string | null, row_count?: number, column_count?: number }) => u.id === s.id);
            if (update) {
              return {
                ...s,
                status: update.status,
                error_message: update.error_message,
                sheets: update.status === 'completed' && s.sheets.length === 0 ? [{
                  id: `${s.id}_sh1`,
                  sheet_name: "Sheet1",
                  table_name: `file_${s.id.replace(/-/g, '_')}`,
                  row_count: update.row_count || 0,
                  col_count: update.column_count || 0,
                  imported_at: s.uploaded_at
                }] : s.sheets
              };
            }
            return s;
          }));
        }
      } catch {
        // ignore errors
      }
    };
    return () => ws.close();
  }, []);

  const handleUpload = async (files: FileList) => {
    const fileArr = Array.from(files);
    const ids = fileArr.map(() => crypto.randomUUID());
    setUploading(fileArr.map((f, i) => ({ name: f.name, id: ids[i] })));
    await Promise.all(
      fileArr.map(async (file) => {
        try {
          const result = await uploadFile(file);
          setSources((prev) => [result, ...prev]);
          addToast({ type: "success", title: "Uploaded", description: file.name });
        } catch (err: unknown) {
          const e = err as { message?: string };
          addToast({ type: "error", title: "Upload failed", description: e?.message ?? file.name });
        }
      })
    );
    setUploading([]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files);
  };

  const openPreview = async (id: string) => {
    setPreviewId(id);
    setPreviewData(null);
    setIsLoadingPreview(true);
    try {
      const data = await getDataSourcePreview(id);
      setPreviewData(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
      setPreviewId(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDataSource(deleteId);
      setSources((prev) => prev.filter((s) => s.id !== deleteId));
      addToast({ type: "success", title: "Deleted" });
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
    } finally {
      setDeleteId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const previewSource = sources.find((s) => s.id === previewId);

  const previewResultTable = previewData
    ? {
        columns: previewData.columns.map((c) => ({ key: c, label: c })),
        rows: previewData.rows.map((row) =>
          Object.fromEntries(previewData.columns.map((c, i) => [c, row[i]]))
        ),
        total_rows: previewData.rows.length,
      }
    : null;

  return (
    <div
      className="flex h-full flex-col overflow-y-auto scrollbar-thin"
      style={{ backgroundColor: "var(--color-bg-base)" }}
    >
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <h1
          className="text-page-heading mb-6"
          style={{ color: "var(--color-text-primary)" }}
        >
          Data Sources
        </h1>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="mb-6 flex cursor-pointer flex-col items-center justify-center rounded-xl py-10 transition-all duration-[120ms]"
          style={{
            border: `2px dashed ${isDragging ? "var(--color-accent)" : "var(--color-border-default)"}`,
            backgroundColor: isDragging ? "var(--color-accent-subtle)" : "var(--color-bg-elevated)",
          }}
        >
          <Upload
            size={24}
            style={{ color: isDragging ? "var(--color-accent)" : "var(--color-text-tertiary)", marginBottom: 8 }}
          />
          <p className="text-body-em" style={{ color: "var(--color-text-primary)" }}>
            Drop Excel files here or click to browse
          </p>
          <p className="text-body mt-1" style={{ color: "var(--color-text-tertiary)" }}>
            .xlsx, .xls supported
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
        </div>

        {uploading.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {uploading.map((f) => (
              <div
                key={f.id}
                className="flex flex-col gap-1 rounded-lg px-4 py-3"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border-default)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-body" style={{ color: "var(--color-text-primary)" }}>
                    {f.name}
                  </span>
                  <span className="text-ui-label" style={{ color: "var(--color-text-tertiary)" }}>
                    Uploading...
                  </span>
                </div>
                <div
                  className="overflow-hidden rounded-full"
                  style={{ height: 4, backgroundColor: "var(--color-bg-hover)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: "var(--color-accent)",
                      width: "60%",
                      animation: "shimmer 1.5s infinite",
                      backgroundImage: "linear-gradient(90deg, var(--color-accent) 25%, var(--color-accent-hover) 50%, var(--color-accent) 75%)",
                      backgroundSize: "200% 100%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <SkeletonTable />
        ) : sources.length === 0 ? (
          <div
            className="rounded-xl py-16 text-center"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-default)",
            }}
          >
            <p className="text-body" style={{ color: "var(--color-text-tertiary)" }}>
              No data sources yet. Upload an Excel file to get started.
            </p>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--color-border-default)" }}
          >
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: "var(--color-bg-hover)" }}>
                  {["Filename", "Status", "Sheets", "Rows", "Size", "Uploaded", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-ui-label uppercase"
                      style={{ color: "var(--color-text-tertiary)", borderBottom: "1px solid var(--color-border-default)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sources.map((src) => {
                  const isExpanded = expandedIds.has(src.id);
                  const totalRows = src.sheets.reduce((a, s) => a + s.row_count, 0);
                  return (
                    <>
                      <tr
                        key={src.id}
                        className="group"
                        style={{
                          height: 48,
                          borderBottom: "1px solid var(--color-border-subtle)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "var(--color-bg-hover)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent";
                        }}
                      >
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpand(src.id)}
                              className="shrink-0 rounded p-0.5 transition-colors duration-[120ms]"
                              style={{ color: "var(--color-text-tertiary)" }}
                              aria-label={isExpanded ? "Collapse" : "Expand"}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            <span
                              className="text-body truncate"
                              style={{ color: "var(--color-text-primary)", maxWidth: 220 }}
                            >
                              {src.original_filename}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span 
                            className="rounded-full px-2 py-0.5 text-xs" 
                            style={{ 
                              backgroundColor: src.status === 'completed' ? 'var(--color-success-subtle)' : src.status === 'error' ? 'var(--color-destructive-subtle)' : 'var(--color-accent-subtle)',
                              color: src.status === 'completed' ? 'var(--color-success)' : src.status === 'error' ? 'var(--color-destructive)' : 'var(--color-accent)'
                            }}
                          >
                            {src.status || 'completed'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-body" style={{ color: "var(--color-text-secondary)" }}>
                          {src.num_sheets}
                        </td>
                        <td className="px-4 py-2 text-body" style={{ color: "var(--color-text-secondary)" }}>
                          {totalRows.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-body" style={{ color: "var(--color-text-secondary)" }}>
                          {formatFileSize(src.file_size_bytes)}
                        </td>
                        <td className="px-4 py-2 text-body" style={{ color: "var(--color-text-secondary)" }}>
                          {formatAbsoluteDate(src.uploaded_at)}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms]">
                            {src.status === 'completed' && (
                              <button
                                onClick={() => openPreview(src.id)}
                                className="flex items-center gap-1 text-ui-label transition-colors duration-[120ms]"
                                style={{ color: "var(--color-text-tertiary)" }}
                                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)"}
                                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-tertiary)"}
                              >
                                <Eye size={13} /> Preview
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteId(src.id)}
                              className="flex items-center gap-1 text-ui-label transition-colors duration-[120ms]"
                              style={{ color: "var(--color-text-tertiary)" }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = "var(--color-destructive)"}
                              onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-tertiary)"}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded &&
                        src.sheets.map((sheet) => (
                          <tr
                            key={sheet.id}
                            style={{
                              backgroundColor: "var(--color-bg-hover)",
                              borderBottom: "1px solid var(--color-border-subtle)",
                            }}
                          >
                            <td
                              className="py-2 pr-4 text-body"
                              style={{
                                paddingLeft: 44,
                                borderLeft: "2px solid var(--color-accent)",
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              {sheet.sheet_name}
                            </td>
                            <td className="px-4 py-2" />
                            <td className="px-4 py-2" />
                            <td className="px-4 py-2 text-body" style={{ color: "var(--color-text-tertiary)" }}>
                              {sheet.row_count.toLocaleString()} rows
                            </td>
                            <td className="px-4 py-2 text-body" style={{ color: "var(--color-text-tertiary)" }}>
                              {sheet.col_count} cols
                            </td>
                            <td colSpan={2} />
                          </tr>
                        ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={previewId !== null} onOpenChange={(o) => !o && setPreviewId(null)}>
        <DialogContent
          className="max-w-4xl"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-default)",
            color: "var(--color-text-primary)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "var(--color-text-primary)" }}>
              Preview — {previewSource?.original_filename}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {isLoadingPreview ? (
              <SkeletonTable />
            ) : previewResultTable ? (
              <ChatResultTable data={previewResultTable} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete data source"
        description="This will permanently remove the file and all its sheets. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
