import { useEffect, useMemo, useState } from "react";
import { Download, Play, Loader2 } from "lucide-react";

import { generateChart } from "@/api/chatApi";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { ResultTable } from "@/types/ChatMessage";

const CHART_TYPES = [
    { value: "bar", label: "Bar" },
    { value: "horizontal-bar", label: "Horizontal" },
    { value: "line", label: "Line" },
    { value: "area", label: "Area" },
    { value: "pie", label: "Pie" },
    { value: "donut", label: "Donut" },
    { value: "scatter", label: "Scatter" },
] as const;

type ChartType = (typeof CHART_TYPES)[number]["value"];

const PALETTES = [
    {
        name: "Citrus",
        colors: ["#F59E0B", "#F97316", "#FBBF24", "#FDBA74", "#FED7AA"],
    },
    {
        name: "Lagoon",
        colors: ["#0EA5E9", "#38BDF8", "#22D3EE", "#7DD3FC", "#BAE6FD"],
    },
    {
        name: "Verdant",
        colors: ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0", "#D1FAE5"],
    },
    {
        name: "Stone",
        colors: ["#64748B", "#94A3B8", "#CBD5F5", "#E2E8F0", "#F1F5F9"],
    },
    {
        name: "Solar",
        colors: ["#F43F5E", "#FB7185", "#FCA5A5", "#FDBA8A", "#FDE68A"],
    },
];

interface QueryResultPanelProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    result: ResultTable | null;
    onExport?: () => void;
    exporting?: boolean;
    exportLabel?: string;
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) return parsed;
    }
    return null;
}

export function QueryResultPanel({
    open,
    onClose,
    title,
    subtitle,
    result,
}: QueryResultPanelProps) {
    const [chartType, setChartType] = useState<ChartType>("bar");
    const [paletteIndex, setPaletteIndex] = useState(0);
    const [xKey, setXKey] = useState<string | null>(null);
    const [yKey, setYKey] = useState<string | null>(null);

    const columnMeta = useMemo(() => {
        if (!result) return { numeric: [], categorical: [] };
        const numeric: string[] = [];
        const categorical: string[] = [];

        result.columns.forEach((col) => {
            const values = result.rows.map((row) => row[col.key]).filter((v) => v !== null && v !== undefined);
            const isNumeric = values.length > 0 && values.every((v) => toNumber(v) !== null);
            if (isNumeric) {
                numeric.push(col.key);
            } else {
                categorical.push(col.key);
            }
        });

        return { numeric, categorical };
    }, [result]);

    const [chartImageUrl, setChartImageUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (!result) return;
        const firstNumeric = columnMeta.numeric[0] ?? result.columns[0]?.key ?? null;
        const firstCategory = columnMeta.categorical[0] ?? result.columns[0]?.key ?? null;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setXKey(firstCategory);
        setYKey(firstNumeric);
        setChartImageUrl(null);
    }, [result, columnMeta]);

    const handleGenerate = async () => {
        if (!result || !xKey || !yKey) return;
        setIsGenerating(true);
        try {
            const blob = await generateChart({
                data: result.rows,
                chart_type: chartType,
                x_key: xKey,
                y_key: yKey,
                title: title || "Chart",
                colors: PALETTES[paletteIndex].colors,
            });
            if (blob) {
                const url = URL.createObjectURL(blob);
                setChartImageUrl(url);
            }
        } catch (error) {
            console.error("Failed to generate chart", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async (format: "PNG" | "SVG") => {
        if (!result || !xKey || !yKey) return;
        try {
            const blob = await generateChart({
                data: result.rows,
                chart_type: chartType,
                x_key: xKey,
                y_key: yKey,
                title: title || "Chart",
                colors: PALETTES[paletteIndex].colors,
                output_format: format.toLowerCase(),
            });
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `chart.${format.toLowerCase()}`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Failed to download chart", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
            <DialogContent
                className="max-w-5xl"
                style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)" }}
            >
                <DialogHeader>
                    <DialogTitle style={{ color: "var(--color-text-primary)" }}>{title || "Chart Builder"}</DialogTitle>
                    {subtitle && (
                        <DialogDescription style={{ color: "var(--color-text-tertiary)" }}>{subtitle}</DialogDescription>
                    )}
                </DialogHeader>

                {!result ? (
                    <p className="mt-4 text-body" style={{ color: "var(--color-text-tertiary)" }}>No data available.</p>
                ) : (
                    <div className="mt-4 grid gap-4 lg:grid-cols-[300px_1fr]">
                        <div
                            className="flex flex-col gap-4 rounded-xl p-4"
                            style={{ backgroundColor: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)" }}
                        >
                            <div>
                                <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>Chart Type</label>
                                <Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
                                    <SelectTrigger className="mt-1 w-full">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CHART_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>X Axis</label>
                                <Select value={xKey ?? ""} onValueChange={(value) => setXKey(value)}>
                                    <SelectTrigger className="mt-1 w-full">
                                        <SelectValue placeholder="Select column" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {result.columns.map((col) => (
                                            <SelectItem key={col.key} value={col.key}>{col.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>Y Axis</label>
                                <Select value={yKey ?? ""} onValueChange={(value) => setYKey(value)}>
                                    <SelectTrigger className="mt-1 w-full">
                                        <SelectValue placeholder="Select numeric column" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {result.columns
                                            .filter((col) => col.key !== xKey)
                                            .map((col) => (
                                                <SelectItem key={col.key} value={col.key}>
                                                    {col.label}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>Palette</label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {PALETTES.map((paletteOption, index) => (
                                        <button
                                            key={paletteOption.name}
                                            onClick={() => setPaletteIndex(index)}
                                            className="rounded-full px-3 py-1 text-ui-label transition-all duration-[120ms]"
                                            style={{
                                                border: paletteIndex === index
                                                    ? "1px solid var(--color-accent)"
                                                    : "1px solid var(--color-border-default)",
                                                color: paletteIndex === index
                                                    ? "var(--color-accent)"
                                                    : "var(--color-text-tertiary)",
                                            }}
                                        >
                                            {paletteOption.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-2">
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-body-em transition-all duration-[120ms] active:scale-[0.98]"
                                    style={{ backgroundColor: "var(--color-accent)", color: "#fff", opacity: isGenerating ? 0.7 : 1 }}
                                >
                                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                                    {isGenerating ? "Generating..." : "Generate Chart"}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {!chartImageUrl && !isGenerating && (
                                <div
                                    className="flex h-[320px] items-center justify-center rounded-xl text-body"
                                    style={{ border: "1px dashed var(--color-border-default)", color: "var(--color-text-tertiary)" }}
                                >
                                    Configure the chart and click Generate
                                </div>
                            )}

                            {isGenerating && (
                                <div
                                    className="flex h-[320px] items-center justify-center rounded-xl text-body"
                                    style={{ backgroundColor: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-tertiary)" }}
                                >
                                    <Loader2 size={32} className="animate-spin text-accent" />
                                </div>
                            )}

                            {chartImageUrl && !isGenerating && (
                                <div className="rounded-xl p-4 overflow-hidden flex items-center justify-center bg-white" style={{ border: "1px solid var(--color-border-subtle)", height: "320px" }}>
                                    <img
                                        src={chartImageUrl}
                                        alt="Generated Chart"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                            )}

                            {chartImageUrl && (
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => handleDownload("PNG")}
                                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-em transition-all duration-[120ms] active:scale-[0.98]"
                                        style={{ backgroundColor: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-default)" }}
                                    >
                                        <Download size={14} />
                                        Download PNG
                                    </button>
                                    <button
                                        onClick={() => handleDownload("SVG")}
                                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-em transition-all duration-[120ms] active:scale-[0.98]"
                                        style={{ backgroundColor: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-default)" }}
                                    >
                                        <Download size={14} />
                                        Download SVG
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
