import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  deleteDataSource,
  getDataSourcePreview,
  getDataSources,
  uploadFile,
  uploadFromUrl,
} from "@/api/dataSourcesApi";
import { ExcelPreviewGrid } from "@/components/ExcelPreviewGrid";
import { SkeletonTable } from "@/components/skeletons/SkeletonTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { websocketService } from "@/services/websocketService";
import type { DataSource, DataSourcePreview, ExcelSheet } from "@/types/DataSource";
import { formatAbsoluteDate, formatFileSize } from "@/utils/formatDate";

interface UploadingFile {
  name: string;
  id: string;
}

export function DataSourcesPage() {
  const { addToast } = useToast();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewSheet, setPreviewSheet] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<DataSourcePreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DataSource | "total_rows";
    direction: "asc" | "desc";
  } | null>(null);

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [uploadTab, setUploadTab] = useState<"files" | "folder" | "url">("files");
  const [urlInput, setUrlInput] = useState("");
  const [isUrlUploading, setIsUrlUploading] = useState(false);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected files?`)
    ) {
      return;
    }

    setIsBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        await deleteDataSource(id);
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Failed to delete data source ${id}`, err);
      }
    }

    setIsBulkDeleting(false);
    setSelectedIds([]);
    void load();

    if (failCount === 0) {
      addToast({
        title: "Bulk Delete Completed",
        description: `Successfully deleted ${successCount} files.`,
        type: "success",
      });
    } else {
      addToast({
        title: "Bulk Delete Completed with Errors",
        description: `Successfully deleted ${successCount} files. Failed to delete ${failCount} files.`,
        type: "warning",
      });
    }
  };

  useEffect(() => {
    const removeListener = websocketService.addListener((payload) => {
      if (payload.type === "status_update") {
        let shouldRefresh = false;
        setSources((prev) =>
          prev.map((s) => {
            const update = payload.data.find(
              (u: { id: string; status: string; error_message: string | null }) => u.id === s.id
            );
            if (update) {
              if (update.status === "completed" && s.sheets.length === 0) {
                shouldRefresh = true;
              }
              return {
                ...s,
                status: update.status,
                error_message: update.error_message,
              };
            }
            return s;
          })
        );
        if (shouldRefresh) {
          void load();
        }
      }
    });

    return () => {
      removeListener();
    };
  }, [load]);

  const supportedExtensions = [".xlsx", ".csv"];

  const handleUpload = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);

    // Filter to supported extensions
    const filteredFiles = fileArr.filter((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      return supportedExtensions.includes(ext);
    });

    const ignoredCount = fileArr.length - filteredFiles.length;
    if (ignoredCount > 0) {
      addToast({
        type: "warning",
        title: "Unsupported files ignored",
        description: `Ignored ${ignoredCount} file(s). Upload .xlsx or .csv files.`,
      });
    }

    if (filteredFiles.length === 0) return;

    const ids = filteredFiles.map(() => crypto.randomUUID());
    setUploading(filteredFiles.map((f, i) => ({ name: f.name, id: ids[i] })));

    await Promise.all(
      filteredFiles.map(async (file) => {
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

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return;
    setIsUrlUploading(true);
    const tempId = crypto.randomUUID();
    setUploading([{ name: urlInput, id: tempId }]);
    try {
      const result = await uploadFromUrl(urlInput.trim());
      setSources((prev) => [result, ...prev]);
      addToast({ type: "success", title: "Imported from URL", description: urlInput });
      setIsUploadModalOpen(false);
      setUrlInput("");
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Import failed", description: e?.message ?? urlInput });
    } finally {
      setIsUrlUploading(false);
      setUploading([]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files);
  };

  const openPreview = async (id: string, sheetName?: string) => {
    setPreviewId(id);
    setPreviewSheet(sheetName ?? null);
    setPreviewData(null);
    setIsLoadingPreview(true);
    try {
      const data = await getDataSourcePreview(id, sheetName);
      setPreviewData(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
      setPreviewId(null);
      setPreviewSheet(null);
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
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filteredSources = useMemo<DataSource[]>(() => {
    const result = sources.filter((s) => {
      const matchesSearch =
        s.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.status?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (dateFrom) {
        const from = new Date(dateFrom);
        if (new Date(s.uploaded_at) < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(s.uploaded_at) > to) return false;
      }
      return true;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let aVal: unknown = a[sortConfig.key as keyof DataSource];
        let bVal: unknown = b[sortConfig.key as keyof DataSource];

        if (sortConfig.key === "total_rows") {
          aVal = a.sheets.reduce((acc: number, s: ExcelSheet) => acc + s.row_count, 0);
          bVal = b.sheets.reduce((acc: number, s: ExcelSheet) => acc + s.row_count, 0);
        }

        if (aVal != null && bVal != null && aVal < (bVal as string | number))
          return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal != null && bVal != null && aVal > (bVal as string | number))
          return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [sources, searchQuery, dateFrom, dateTo, sortConfig]);

  const handleSort = (key: keyof DataSource | "total_rows") => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return null;
      }
      return { key, direction: "asc" };
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
      className="flex h-full flex-col overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-base)" }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-page-heading" style={{ color: "var(--color-text-primary)" }}>
              Data Sources
            </h1>
            <p className="text-body mt-1" style={{ color: "var(--color-text-tertiary)" }}>
              Manage and explore your uploaded data assets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2"
                size={15}
                style={{ color: "var(--color-text-tertiary)" }}
              />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-64 rounded-lg pl-9 pr-4 text-body outline-none border transition-all"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  borderColor: "var(--color-border-default)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 rounded-lg px-3 text-body outline-none border transition-all"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                borderColor: "var(--color-border-default)",
                color: "var(--color-text-primary)",
              }}
              title="From date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 rounded-lg px-3 text-body outline-none border transition-all"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                borderColor: "var(--color-border-default)",
                color: "var(--color-text-primary)",
              }}
              title="To date"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="h-10 rounded-lg px-3 text-body-em transition-all"
                style={{
                  border: "1px solid var(--color-border-default)",
                  color: "var(--color-text-secondary)",
                  backgroundColor: "transparent",
                }}
              >
                Reset
              </button>
            )}

            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="flex h-10 items-center gap-2 rounded-lg bg-destructive px-4 text-body-em text-white shadow-lg shadow-destructive/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <Trash2 size={16} /> Delete Selected ({selectedIds.length})
              </button>
            )}

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-body-em text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={16} /> Upload
            </button>
          </div>
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
                      backgroundImage:
                        "linear-gradient(90deg, var(--color-accent) 25%, var(--color-accent-hover) 50%, var(--color-accent) 75%)",
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
        ) : filteredSources.length === 0 ? (
          <div
            className="rounded-xl py-16 text-center"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-default)",
            }}
          >
            <p className="text-body" style={{ color: "var(--color-text-tertiary)" }}>
              {searchQuery
                ? "No matching data sources found."
                : "No data sources yet. Upload an Excel file to get started."}
            </p>
          </div>
        ) : (
          <div
            className="flex-1 min-h-0 overflow-y-auto scrollbar-thin rounded-xl"
            style={{
              border: "1px solid var(--color-border-default)",
              backgroundColor: "var(--color-bg-elevated)",
            }}
          >
            <table className="w-full border-collapse sticky-header">
              <thead>
                <tr
                  className="sticky top-0 z-10"
                  style={{ backgroundColor: "var(--color-bg-hover)" }}
                >
                  <th
                    className="px-4 py-3 text-left w-12"
                    style={{ borderBottom: "1px solid var(--color-border-default)" }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        filteredSources.length > 0 && selectedIds.length === filteredSources.length
                      }
                      ref={(input) => {
                        if (input) {
                          input.indeterminate =
                            selectedIds.length > 0 && selectedIds.length < filteredSources.length;
                        }
                      }}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredSources.map((s) => s.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      className="rounded border-gray-300 text-accent focus:ring-accent"
                    />
                  </th>
                  {[
                    { label: "Filename", key: "original_filename" },
                    { label: "Status", key: "status" },
                    { label: "Sheets", key: "num_sheets" },
                    { label: "Rows", key: "total_rows" },
                    { label: "Size", key: "file_size_bytes" },
                    { label: "Uploaded", key: "uploaded_at" },
                    { label: "Actions", key: null },
                  ].map((h) => (
                    <th
                      key={h.label}
                      onClick={() => h.key && handleSort(h.key as keyof DataSource | "total_rows")}
                      className={`px-4 py-3 text-left text-ui-label uppercase ${h.key ? "cursor-pointer select-none" : ""}`}
                      style={{
                        color: "var(--color-text-tertiary)",
                        borderBottom: "1px solid var(--color-border-default)",
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {h.label}
                        {sortConfig?.key === h.key && (
                          <span className="text-accent">
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSources.map((src: DataSource) => {
                  const isExpanded = expandedId === src.id;
                  const totalRows = src.sheets.reduce(
                    (a: number, s: ExcelSheet) => a + s.row_count,
                    0
                  );
                  return (
                    <Fragment key={src.id}>
                      <tr
                        className="group cursor-pointer"
                        onClick={() => toggleExpand(src.id)}
                        style={{
                          height: 48,
                          borderBottom: "1px solid var(--color-border-subtle)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                            "var(--color-bg-hover)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                            "transparent";
                        }}
                      >
                        <td className="px-4 py-2 w-12" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(src.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds((prev) => [...prev, src.id]);
                              } else {
                                setSelectedIds((prev) => prev.filter((id) => id !== src.id));
                              }
                            }}
                            className="rounded border-gray-300 text-accent focus:ring-accent"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(src.id);
                              }}
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
                              backgroundColor:
                                src.status === "completed"
                                  ? "var(--color-success-subtle)"
                                  : src.status === "error"
                                    ? "var(--color-destructive-subtle)"
                                    : "var(--color-accent-subtle)",
                              color:
                                src.status === "completed"
                                  ? "var(--color-success)"
                                  : src.status === "error"
                                    ? "var(--color-destructive)"
                                    : "var(--color-accent)",
                            }}
                          >
                            {src.status || "completed"}
                          </span>
                        </td>
                        <td
                          className="px-4 py-2 text-body"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {src.num_sheets}
                        </td>
                        <td
                          className="px-4 py-2 text-body"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {totalRows.toLocaleString()}
                        </td>
                        <td
                          className="px-4 py-2 text-body"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {formatFileSize(src.file_size_bytes)}
                        </td>
                        <td
                          className="px-4 py-2 text-body"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {formatAbsoluteDate(src.uploaded_at)}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms]">
                            {src.status === "completed" && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPreview(src.id);
                                  }}
                                  className="flex items-center gap-1 text-ui-label transition-colors duration-[120ms]"
                                  style={{ color: "var(--color-text-tertiary)" }}
                                  onMouseEnter={(e) =>
                                    ((e.currentTarget as HTMLButtonElement).style.color =
                                      "var(--color-text-primary)")
                                  }
                                  onMouseLeave={(e) =>
                                    ((e.currentTarget as HTMLButtonElement).style.color =
                                      "var(--color-text-tertiary)")
                                  }
                                >
                                  <Eye size={13} /> Preview
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/excel-editor?fileId=${src.id}`);
                                  }}
                                  className="flex items-center gap-1 text-ui-label transition-colors duration-[120ms]"
                                  style={{ color: "var(--color-text-tertiary)" }}
                                  onMouseEnter={(e) =>
                                    ((e.currentTarget as HTMLButtonElement).style.color =
                                      "var(--color-accent)")
                                  }
                                  onMouseLeave={(e) =>
                                    ((e.currentTarget as HTMLButtonElement).style.color =
                                      "var(--color-text-tertiary)")
                                  }
                                >
                                  <ExternalLink size={13} /> Edit
                                </button>
                              </>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(src.id);
                              }}
                              className="flex items-center gap-1 text-ui-label transition-colors duration-[120ms]"
                              style={{ color: "var(--color-text-tertiary)" }}
                              onMouseEnter={(e) =>
                                ((e.currentTarget as HTMLButtonElement).style.color =
                                  "var(--color-destructive)")
                              }
                              onMouseLeave={(e) =>
                                ((e.currentTarget as HTMLButtonElement).style.color =
                                  "var(--color-text-tertiary)")
                              }
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded &&
                        src.sheets.map((sheet: ExcelSheet) => (
                          <tr
                            key={sheet.id}
                            style={{
                              backgroundColor: "var(--color-bg-hover)",
                              borderBottom: "1px solid var(--color-border-subtle)",
                            }}
                          >
                            <td className="px-4 py-2 w-12" />
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
                            <td
                              className="px-4 py-2 text-body"
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              {sheet.row_count.toLocaleString()} rows
                            </td>
                            <td
                              className="px-4 py-2 text-body"
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              {sheet.col_count} cols
                            </td>
                            <td className="px-4 py-2" />
                            <td className="px-4 py-2">
                              <button
                                onClick={() => openPreview(src.id, sheet.sheet_name)}
                                className="flex items-center gap-1 text-ui-label transition-colors duration-[120ms]"
                                style={{ color: "var(--color-text-tertiary)" }}
                                onMouseEnter={(e) =>
                                  ((e.currentTarget as HTMLButtonElement).style.color =
                                    "var(--color-text-primary)")
                                }
                                onMouseLeave={(e) =>
                                  ((e.currentTarget as HTMLButtonElement).style.color =
                                    "var(--color-text-tertiary)")
                                }
                              >
                                <Eye size={13} /> Preview
                              </button>
                            </td>
                          </tr>
                        ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={isUploadModalOpen}
        onOpenChange={(o) => {
          setIsUploadModalOpen(o);
          if (!o) {
            setUrlInput("");
          }
        }}
      >
        <DialogContent
          className="sm:max-w-[500px]"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-default)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "var(--color-text-primary)" }}>
              Upload Data Sources
            </DialogTitle>
          </DialogHeader>

          {/* Premium Tab Selector */}
          <div
            className="flex gap-1 rounded-xl p-1 mb-4"
            style={{ backgroundColor: "var(--color-bg-hover)" }}
          >
            {(["files", "folder", "url"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setUploadTab(tab)}
                className="flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition-all"
                style={{
                  backgroundColor: uploadTab === tab ? "var(--color-bg-elevated)" : "transparent",
                  color:
                    uploadTab === tab ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  boxShadow: uploadTab === tab ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {tab === "files" ? "Files" : tab === "folder" ? "Folder" : "From URL"}
              </button>
            ))}
          </div>

          {uploadTab === "files" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                handleDrop(e);
                setIsUploadModalOpen(false);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl py-12 transition-all duration-[120ms]"
              style={{
                border: `2px dashed ${isDragging ? "var(--color-accent)" : "var(--color-border-default)"}`,
                backgroundColor: isDragging
                  ? "var(--color-accent-subtle)"
                  : "var(--color-bg-hover)",
              }}
            >
              <Upload
                size={32}
                style={{
                  color: isDragging ? "var(--color-accent)" : "var(--color-text-tertiary)",
                  marginBottom: 12,
                }}
              />
              <p
                className="text-body-em text-center"
                style={{ color: "var(--color-text-primary)" }}
              >
                Drop Excel files here
                <br />
                or click to browse
              </p>
              <p className="text-ui-label mt-2" style={{ color: "var(--color-text-tertiary)" }}>
                .xlsx and .csv supported
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleUpload(e.target.files);
                    setIsUploadModalOpen(false);
                  }
                }}
              />
            </div>
          )}

          {uploadTab === "folder" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                handleDrop(e);
                setIsUploadModalOpen(false);
              }}
              onClick={() => folderInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl py-12 transition-all duration-[120ms]"
              style={{
                border: `2px dashed ${isDragging ? "var(--color-accent)" : "var(--color-border-default)"}`,
                backgroundColor: isDragging
                  ? "var(--color-accent-subtle)"
                  : "var(--color-bg-hover)",
              }}
            >
              <Upload
                size={32}
                style={{
                  color: isDragging ? "var(--color-accent)" : "var(--color-text-tertiary)",
                  marginBottom: 12,
                }}
              />
              <p
                className="text-body-em text-center"
                style={{ color: "var(--color-text-primary)" }}
              >
                Drop folder here
                <br />
                or click to browse folder
              </p>
              <p className="text-ui-label mt-2" style={{ color: "var(--color-text-tertiary)" }}>
                Supported files will be filtered and imported
              </p>
              <input
                ref={folderInputRef}
                type="file"
                {...({
                  webkitdirectory: "",
                  directory: "",
                } as React.InputHTMLAttributes<HTMLInputElement>)}
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleUpload(e.target.files);
                    setIsUploadModalOpen(false);
                  }
                }}
              />
            </div>
          )}

          {uploadTab === "url" && (
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>
                  FILE URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/dataset.xlsx"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-body outline-none animate-in fade-in"
                  style={{
                    backgroundColor: "var(--color-bg-hover)",
                    border: "1px solid var(--color-border-default)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
              <button
                onClick={handleUrlUpload}
                disabled={isUrlUploading || !urlInput.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.99]"
                style={{
                  backgroundColor: urlInput.trim()
                    ? "var(--color-accent)"
                    : "var(--color-bg-hover)",
                  color: urlInput.trim() ? "#fff" : "var(--color-text-tertiary)",
                  cursor: urlInput.trim() ? "pointer" : "default",
                }}
              >
                {isUrlUploading ? "Downloading & Importing..." : "Download & Import"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={previewId !== null} onOpenChange={(o) => !o && setPreviewId(null)}>
        <DialogContent
          className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] flex flex-col p-6"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-default)",
            color: "var(--color-text-primary)",
          }}
        >
          <DialogHeader className="flex-none flex flex-row items-center justify-between gap-4">
            <div>
              <DialogTitle style={{ color: "var(--color-text-primary)" }}>
                Preview — {previewSource?.original_filename}
              </DialogTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                {previewSource?.sheets.map((s) => (
                  <button
                    key={s.sheet_name}
                    onClick={() => openPreview(previewSource.id, s.sheet_name)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      previewSheet === s.sheet_name ||
                      (!previewSheet && s === previewSource.sheets[0])
                        ? "bg-accent text-white"
                        : "bg-bg-hover text-tertiary border border-border-default hover:text-secondary"
                    }`}
                  >
                    {s.sheet_name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => previewSource && navigate(`/excel-editor?fileId=${previewSource.id}`)}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ExternalLink size={14} /> Open in Editor
            </button>
          </DialogHeader>

          <div
            className="flex-1 min-h-0 mt-4 border rounded-xl overflow-hidden"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            {isLoadingPreview ? (
              <div className="w-full h-full flex items-center justify-center">
                <SkeletonTable />
              </div>
            ) : previewResultTable ? (
              <ExcelPreviewGrid result={previewResultTable} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-tertiary">
                Select a sheet to preview
              </div>
            )}
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
