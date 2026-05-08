import { useEffect, useMemo, useRef, useState } from "react";
import ApexCharts, { type ApexAxisChartSeries, type ApexNonAxisChartSeries } from "apexcharts";
import { Download, Play } from "lucide-react";

import { ChartRenderer } from "@/components/charts/ChartRenderer";
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
    const chartIdRef = useRef(`chart-${Math.random().toString(36).slice(2, 9)}`);
    const [chartType, setChartType] = useState<ChartType>("bar");
    const [paletteIndex, setPaletteIndex] = useState(0);
    const [xKey, setXKey] = useState<string | null>(null);
    const [yKey, setYKey] = useState<string | null>(null);
    
    const [committedConfig, setCommittedConfig] = useState<{
        type: ChartType;
        x: string | null;
        y: string | null;
        palette: number;
    } | null>(null);

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

    useEffect(() => {
        if (!result) return;
        const firstNumeric = columnMeta.numeric[0] ?? result.columns[0]?.key ?? null;
        const firstCategory = columnMeta.categorical[0] ?? result.columns[0]?.key ?? null;

        setXKey(firstCategory);
        setYKey(firstNumeric);
        setCommittedConfig(null);
    }, [result, columnMeta]);

    const handleGenerate = () => {
        setCommittedConfig({
            type: chartType,
            x: xKey,
            y: yKey,
            palette: paletteIndex
        });
    };

    const chartData = useMemo<{
        series: ApexAxisChartSeries | ApexNonAxisChartSeries | null;
        categories: string[];
        labels: string[];
        error: string | null;
    }>(() => {
        if (!result || !committedConfig) return { series: null, categories: [], labels: [], error: null };

        const { type, x: cXKey, y: cYKey } = committedConfig;

        if (["bar", "horizontal-bar", "line", "area"].includes(type)) {
            if (!cXKey || !cYKey) return { series: null, categories: [], labels: [], error: "Select X and Y axes." };
            const categories: string[] = [];
            const categoryIndex = new Map<string, number>();
            const dataArr: number[] = [];

            result.rows.forEach((row) => {
                const xVal = row[cXKey];
                const yVal = toNumber(row[cYKey]);
                if (yVal === null) return;
                const category = xVal === null || xVal === undefined ? "Unknown" : String(xVal);
                if (!categoryIndex.has(category)) {
                    categoryIndex.set(category, categories.length);
                    categories.push(category);
                    dataArr.push(0);
                }
                dataArr[categoryIndex.get(category)!] += yVal;
            });

            return { series: [{ name: "Series", data: dataArr }], categories, labels: [], error: dataArr.length ? null : "No numeric data." };
        }

        if (["pie", "donut"].includes(type)) {
            if (!cXKey || !cYKey) return { series: null, categories: [], labels: [], error: "Select X (label) and Y (value)." };
            const totals = new Map<string, number>();
            result.rows.forEach((row) => {
                const label = row[cXKey];
                const val = toNumber(row[cYKey]);
                if (val === null) return;
                const key = label === null || label === undefined ? "Unknown" : String(label);
                totals.set(key, (totals.get(key) ?? 0) + val);
            });
            const labels = Array.from(totals.keys());
            const series = labels.map((label) => totals.get(label) ?? 0);
            return { series, categories: [], labels, error: series.length ? null : "No numeric data." };
        }

        if (type === "scatter") {
            if (!cXKey || !cYKey) return { series: null, categories: [], labels: [], error: "Select X and Y axes." };
            const points: { x: number; y: number }[] = [];
            result.rows.forEach((row) => {
                const xVal = toNumber(row[cXKey]);
                const yVal = toNumber(row[cYKey]);
                if (xVal === null || yVal === null) return;
                points.push({ x: xVal, y: yVal });
            });
            return { series: [{ name: "Series", data: points }], categories: [], labels: [], error: points.length ? null : "No numeric data." };
        }

        return { series: null, categories: [], labels: [], error: "Unsupported chart type." };
    }, [result, committedConfig]);

    const handleDownload = (type: "PNG" | "SVG") => {
        if (!chartData.series) return;
        if (type === "PNG") {
            ApexCharts.exec(chartIdRef.current, "downloadPNG");
        } else {
            ApexCharts.exec(chartIdRef.current, "downloadSVG");
        }
    };

    const hasChart = chartData.series !== null && !chartData.error;
    const activePalette = committedConfig ? PALETTES[committedConfig.palette] : PALETTES[paletteIndex];

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
                                        {(columnMeta.numeric.length ? columnMeta.numeric : result.columns.map((c) => c.key)).map((key) => {
                                            const col = result.columns.find((c) => c.key === key);
                                            return <SelectItem key={key} value={key}>{col?.label ?? key}</SelectItem>;
                                        })}
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
                                    className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-body-em transition-all duration-[120ms] active:scale-[0.98]"
                                    style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
                                >
                                    <Play size={16} />
                                    Generate Chart
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {chartData.error && (
                                <div
                                    className="rounded-xl p-4 text-body"
                                    style={{ backgroundColor: "var(--color-bg-hover)", border: "1px dashed var(--color-border-default)", color: "var(--color-text-tertiary)" }}
                                >
                                    {chartData.error}
                                </div>
                            )}

                            {!committedConfig && !chartData.error && (
                                <div
                                    className="flex h-[320px] items-center justify-center rounded-xl text-body"
                                    style={{ border: "1px dashed var(--color-border-default)", color: "var(--color-text-tertiary)" }}
                                >
                                    Configure the chart and click Generate
                                </div>
                            )}

                            {hasChart && committedConfig && (
                                <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)" }}>
                                    <ChartRenderer
                                        type={committedConfig.type === "horizontal-bar" ? "horizontal-bar" : committedConfig.type}
                                        series={chartData.series ?? []}
                                        categories={chartData.categories}
                                        labels={chartData.labels}
                                        title={title || "Chart"}
                                        chartId={chartIdRef.current}
                                        colors={activePalette.colors}
                                        height={320}
                                    />
                                </div>
                            )}

                            {hasChart && committedConfig && (
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
