import { useCallback, useEffect, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";

import { getArtifacts } from "@/api/artifactsApi";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/skeletons/SkeletonCard";
import { SkeletonText } from "@/components/skeletons/SkeletonText";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
import type { ArtifactChart, ArtifactExport } from "@/types/Artifact";
import { formatAbsoluteDate, formatFileSize } from "@/utils/formatDate";

interface ArtifactsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ArtifactsDrawer({ open, onClose }: ArtifactsDrawerProps) {
  const { addToast } = useToast();
  const [exports, setExports] = useState<ArtifactExport[]>([]);
  const [charts, setCharts] = useState<ArtifactChart[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!open) return;
    setIsLoading(true);
    try {
      const data = await getArtifacts();
      setExports(data.excel_exports);
      setCharts(data.charts);
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
    } finally {
      setIsLoading(false);
    }
  }, [open, addToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  return (
    <Drawer open={open} onClose={onClose} side="left" width={300}>
      <div className="flex h-full flex-col">
        <div
          className="px-4 py-3"
          style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
        >
          <p className="text-panel-heading" style={{ color: "var(--color-text-primary)" }}>
            Artifacts
          </p>
        </div>

        <Tabs defaultValue="exports" className="flex flex-1 flex-col overflow-hidden">
          <TabsList
            className="mx-4 mt-2 h-8 shrink-0 rounded-lg"
            style={{
              backgroundColor: "var(--color-bg-hover)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            <TabsTrigger
              value="exports"
              className="flex-1 text-ui-label"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Excel Exports
            </TabsTrigger>
            <TabsTrigger
              value="charts"
              className="flex-1 text-ui-label"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Charts
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="exports"
            className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin"
          >
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonText key={i} height="64px" className="rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {exports.map((exp) => (
                  <div
                    key={exp.id}
                    className="group flex items-start gap-2 rounded-lg p-2 transition-colors duration-[120ms]"
                    style={{ backgroundColor: "transparent" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--color-bg-hover)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"}
                  >
                    <FileSpreadsheet size={20} style={{ color: "var(--color-success)", flexShrink: 0, marginTop: 2 }} />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-body truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {exp.title}
                      </p>
                      <p
                        className="text-ui-label mt-0.5"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {exp.source_session_name} · {formatFileSize(exp.file_size_bytes)} · {formatAbsoluteDate(exp.created_at)}
                      </p>
                    </div>
                    <button
                      className="shrink-0 rounded p-1 opacity-0 group-hover:opacity-100 transition-all duration-[120ms]"
                      style={{ color: "var(--color-text-tertiary)" }}
                      aria-label="Download export"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="charts"
            className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin"
          >
            {isLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} height="120px" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {charts.map((chart) => (
                  <div
                    key={chart.id}
                    className="relative overflow-hidden rounded-lg transition-all duration-150"
                    style={{
                      height: 120,
                      border: "1px solid var(--color-border-default)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)";
                      (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-accent-border)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
                      (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border-default)";
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)",
                        opacity: 0.85,
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col justify-between p-2">
                      <Badge variant="accent" className="self-start text-[10px]">
                        {chart.chart_type}
                      </Badge>
                      <div>
                        <p
                          className="text-ui-label truncate"
                          style={{ color: "#fff", fontWeight: 600 }}
                        >
                          {chart.title}
                        </p>
                        <p className="text-ui-label" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {formatAbsoluteDate(chart.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Drawer>
  );
}
