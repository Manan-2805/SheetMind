import { useEffect, useMemo, useRef, useState } from "react";
import ApexCharts, { type ApexAxisChartSeries, type ApexNonAxisChartSeries } from "apexcharts";
import { Download } from "lucide-react";

import { ChatResultTable } from "@/components/chat/ChatResultTable";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
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
    { value: "histogram", label: "Histogram" },
    { value: "heatmap", label: "Heatmap" },
    { value: "pivot", label: "Pivot" },
] as const;

type ChartType = (typeof CHART_TYPES)[number]["value"];

type AggregateMode = "sum" | "avg" | "count";

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
    onExport?: () => Promise<void> | void;
    exportLabel?: string;
    exporting?: boolean;
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) return parsed;
    }
    return null;
}

function uniqueValues(values: Array<unknown>): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    values.forEach((value) => {
        const key = value === null || value === undefined ? "Unknown" : String(value);
        if (!seen.has(key)) {
            seen.add(key);
            result.push(key);
        }
    });
    return result;
}

export function QueryResultPanel({
    open,
    onClose,
    title,
    subtitle,
    result,
    onExport,
    exportLabel = "Export",
    exporting = false,
}: QueryResultPanelProps) {
    const chartIdRef = useRef(`chart-${Math.random().toString(36).slice(2, 9)}`);
    const [chartType, setChartType] = useState<ChartType>("bar");
    const [chartTitle, setChartTitle] = useState("");
    const [paletteIndex, setPaletteIndex] = useState(0);
    const [xKey, setXKey] = useState<string | null>(null);
    const [yKey, setYKey] = useState<string | null>(null);
    const [groupKey, setGroupKey] = useState<string | null>(null);
    const [labelKey, setLabelKey] = useState<string | null>(null);
    const [valueKey, setValueKey] = useState<string | null>(null);
    const [bucketCount, setBucketCount] = useState(10);
    const [pivotRowKey, setPivotRowKey] = useState<string | null>(null);
    const [pivotColumnKey, setPivotColumnKey] = useState<string | null>(null);
    const [pivotValueKey, setPivotValueKey] = useState<string | null>(null);
    const [aggregateMode, setAggregateMode] = useState<AggregateMode>("sum");

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
        const secondCategory = columnMeta.categorical[1] ?? null;

        setChartTitle(subtitle || title || "Query result");
        setXKey(firstCategory);
        setYKey(firstNumeric);
        setGroupKey(secondCategory);
        setLabelKey(firstCategory);
        setValueKey(firstNumeric);
        setPivotRowKey(firstCategory);
        setPivotColumnKey(secondCategory ?? firstCategory);
        setPivotValueKey(firstNumeric);
    }, [result, title, subtitle, columnMeta]);

    const pivotTable = useMemo(() => {
        if (!result || chartType !== "pivot") return null;
        if (!pivotRowKey || !pivotColumnKey || !pivotValueKey) return null;

        const rowValues = uniqueValues(result.rows.map((row) => row[pivotRowKey]));
        const colValues = uniqueValues(result.rows.map((row) => row[pivotColumnKey]));

        const cellMap = new Map<string, Map<string, { sum: number; count: number }>>();
        result.rows.forEach((row) => {
            const rowVal = row[pivotRowKey];
            const colVal = row[pivotColumnKey];
            const numericVal = toNumber(row[pivotValueKey]);
            if (rowVal === null || rowVal === undefined || colVal === null || colVal === undefined) return;
            const rowKey = String(rowVal);
            const colKey = String(colVal);
            const rowMap = cellMap.get(rowKey) ?? new Map();
            const cell = rowMap.get(colKey) ?? { sum: 0, count: 0 };
            if (aggregateMode === "count") {
                cell.count += 1;
            } else if (numericVal !== null) {
                cell.sum += numericVal;
                cell.count += 1;
            }
            rowMap.set(colKey, cell);
            cellMap.set(rowKey, rowMap);
        });

        const columns = [
            { key: "pivot_row", label: pivotRowKey },
            ...colValues.map((col, index) => ({ key: `col_${index}`, label: col })),
        ];

        const rows = rowValues.map((rowVal) => {
            const rowMap = cellMap.get(rowVal) ?? new Map();
            const rowObj: Record<string, unknown> = { pivot_row: rowVal };
            colValues.forEach((col, index) => {
                const cell = rowMap.get(col);
                if (!cell) {
                    rowObj[`col_${index}`] = 0;
                    return;
                }
                if (aggregateMode === "avg") {
                    rowObj[`col_${index}`] = cell.count ? cell.sum / cell.count : 0;
                } else if (aggregateMode === "count") {
                    rowObj[`col_${index}`] = cell.count;
                } else {
                    rowObj[`col_${index}`] = cell.sum;
                }
            });
            return rowObj;
        });

        return {
            columns,
            rows,
            total_rows: rows.length,
        } satisfies ResultTable;
    }, [result, chartType, pivotRowKey, pivotColumnKey, pivotValueKey, aggregateMode]);

    const chartData = useMemo<{
        series: ApexAxisChartSeries | ApexNonAxisChartSeries | null;
        categories: string[];
        labels: string[];
        error: string | null;
    }>(() => {
        if (!result) return { series: null, categories: [], labels: [], error: "No data" };

        if (["bar", "horizontal-bar", "line", "area"].includes(chartType)) {
            if (!xKey || !yKey) return { series: null, categories: [], labels: [], error: "Select X and Y axes." };
            const categories: string[] = [];
            const categoryIndex = new Map<string, number>();
            const seriesMap = new Map<string, number[]>();

            result.rows.forEach((row) => {
                const xVal = row[xKey];
                const yVal = toNumber(row[yKey]);
                if (yVal === null) return;
                const category = xVal === null || xVal === undefined ? "Unknown" : String(xVal);
                if (!categoryIndex.has(category)) {
                    categoryIndex.set(category, categories.length);
                    categories.push(category);
                    seriesMap.forEach((data) => data.push(0));
                }

                const group = groupKey ? row[groupKey] : "Series";
                const groupName = group === null || group === undefined ? "Series" : String(group);
                if (!seriesMap.has(groupName)) {
                    seriesMap.set(groupName, Array(categories.length).fill(0));
                }
                const data = seriesMap.get(groupName)!;
                data[categoryIndex.get(category)!] += yVal;
            });

            const series = Array.from(seriesMap.entries()).map(([name, data]) => ({ name, data }));
            return { series, categories, labels: [], error: series.length ? null : "No numeric data." };
        }

        if (["pie", "donut"].includes(chartType)) {
            if (!labelKey || !valueKey) return { series: null, categories: [], labels: [], error: "Select label and value columns." };
            const totals = new Map<string, number>();
            result.rows.forEach((row) => {
                const label = row[labelKey];
                const val = toNumber(row[valueKey]);
                if (val === null) return;
                const key = label === null || label === undefined ? "Unknown" : String(label);
                totals.set(key, (totals.get(key) ?? 0) + val);
            });
            const labels = Array.from(totals.keys());
            const series = labels.map((label) => totals.get(label) ?? 0);
            return { series, categories: [], labels, error: series.length ? null : "No numeric data." };
        }

        if (chartType === "scatter") {
            if (!xKey || !yKey) return { series: null, categories: [], labels: [], error: "Select X and Y axes." };
            const seriesMap = new Map<string, { x: number; y: number }[]>();
            result.rows.forEach((row) => {
                const xVal = toNumber(row[xKey]);
                const yVal = toNumber(row[yKey]);
                if (xVal === null || yVal === null) return;
                const group = groupKey ? row[groupKey] : "Series";
                const groupName = group === null || group === undefined ? "Series" : String(group);
                const points = seriesMap.get(groupName) ?? [];
                points.push({ x: xVal, y: yVal });
                seriesMap.set(groupName, points);
            });
            const series = Array.from(seriesMap.entries()).map(([name, data]) => ({ name, data }));
            return { series, categories: [], labels: [], error: series.length ? null : "No numeric data." };
        }

        if (chartType === "histogram") {
            if (!valueKey) return { series: null, categories: [], labels: [], error: "Select a numeric column." };
            const values = result.rows.map((row) => toNumber(row[valueKey])).filter((v): v is number => v !== null);
            if (values.length === 0) return { series: null, categories: [], labels: [], error: "No numeric data." };
            const min = Math.min(...values);
            const max = Math.max(...values);
            const buckets = Math.max(1, bucketCount);
            const step = min === max ? 1 : (max - min) / buckets;
            const counts = Array(buckets).fill(0);
            values.forEach((value) => {
                const index = step === 0 ? 0 : Math.min(buckets - 1, Math.floor((value - min) / step));
                counts[index] += 1;
            });
            const categories = counts.map((_, index) => {
                const start = min + index * step;
                const end = start + step;
                return `${start.toFixed(2)}-${end.toFixed(2)}`;
            });
            const series = [{ name: "Count", data: counts }];
            return { series, categories, labels: [], error: null };
        }

        if (chartType === "heatmap") {
            if (!xKey || !yKey || !valueKey) return { series: null, categories: [], labels: [], error: "Select X, Y, and value columns." };
            const xValues = uniqueValues(result.rows.map((row) => row[xKey]));
            const yValues = uniqueValues(result.rows.map((row) => row[yKey]));
            const cellMap = new Map<string, Map<string, { sum: number; count: number }>>();

            result.rows.forEach((row) => {
                const xVal = row[xKey];
                const yVal = row[yKey];
                const numVal = toNumber(row[valueKey]);
                if (xVal === null || xVal === undefined || yVal === null || yVal === undefined || numVal === null) return;
                const xKeyStr = String(xVal);
                const yKeyStr = String(yVal);
                const rowMap = cellMap.get(yKeyStr) ?? new Map();
                const cell = rowMap.get(xKeyStr) ?? { sum: 0, count: 0 };
                cell.sum += numVal;
                cell.count += 1;
                rowMap.set(xKeyStr, cell);
                cellMap.set(yKeyStr, rowMap);
            });

            const series = yValues.map((yVal) => {
                const rowMap = cellMap.get(yVal) ?? new Map();
                const data = xValues.map((xVal) => ({
                    x: xVal,
                    y: rowMap.get(xVal)?.sum ?? 0,
                }));
                return { name: yVal, data };
            });

            return { series, categories: [], labels: [], error: series.length ? null : "No numeric data." };
        }

        if (chartType === "pivot") {
            if (!pivotTable) return { series: null, categories: [], labels: [], error: "Select pivot fields." };
            return { series: null, categories: [], labels: [], error: null };
        }

        return { series: null, categories: [], labels: [], error: "Unsupported chart type." };
    }, [
        result,
        chartType,
        xKey,
        yKey,
        groupKey,
        labelKey,
        valueKey,
        bucketCount,
        pivotTable,
    ]);

    const handleDownload = (type: "PNG" | "SVG") => {
        if (!chartData.series || chartType === "pivot") return;
        if (type === "PNG") {
            ApexCharts.exec(chartIdRef.current, "downloadPNG");
        } else {
            ApexCharts.exec(chartIdRef.current, "downloadSVG");
        }
    };

    const hasChart = chartData.series && chartType !== "pivot";
    const palette = PALETTES[paletteIndex];

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
            <DialogContent
                className="max-w-5xl"
                style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)" }}
            >
                <DialogHeader>
                    <DialogTitle style={{ color: "var(--color-text-primary)" }}>{title || "Query Result"}</DialogTitle>
                    {subtitle && (
                        <DialogDescription style={{ color: "var(--color-text-tertiary)" }}>{subtitle}</DialogDescription>
                    )}
                </DialogHeader>

                <Tabs defaultValue="table" className="mt-4">
                    <TabsList
                        className="w-full"
                        style={{ backgroundColor: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)" }}
                    >
                        <TabsTrigger value="table" className="flex-1">Table</TabsTrigger>
                        <TabsTrigger value="chart" className="flex-1">Chart Builder</TabsTrigger>
                    </TabsList>

                    <TabsContent value="table" className="mt-4">
                        {result ? (
                            <ChatResultTable data={result} />
                        ) : (
                            <p className="text-body" style={{ color: "var(--color-text-tertiary)" }}>No result data.</p>
                        )}
                        {onExport && (
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={onExport}
                                    disabled={exporting}
                                    className="rounded-lg px-4 py-2 text-body-em transition-all duration-[120ms]"
                                    style={{ backgroundColor: "var(--color-accent)", color: "#fff", opacity: exporting ? 0.7 : 1 }}
                                >
                                    {exporting ? "Exporting..." : exportLabel}
                                </button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="chart" className="mt-4">
                        {!result ? (
                            <p className="text-body" style={{ color: "var(--color-text-tertiary)" }}>No data available.</p>
                        ) : (
                            <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
                                <div
                                    className="rounded-xl p-4"
                                    style={{ backgroundColor: "var(--color-bg-hover)", border: "1px solid var(--color-border-subtle)" }}
                                >
                                    <p className="text-body-em" style={{ color: "var(--color-text-primary)" }}>Chart Builder</p>

                                    <Tabs value={chartType} onValueChange={(value) => setChartType(value as ChartType)} className="mt-3">
                                        <TabsList
                                            variant="line"
                                            className="flex flex-wrap"
                                            style={{ borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: 6 }}
                                        >
                                            {CHART_TYPES.map((type) => (
                                                <TabsTrigger key={type.value} value={type.value}>
                                                    {type.label}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </Tabs>

                                    <div className="mt-4 grid gap-3">
                                        <div>
                                            <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>Title</label>
                                            <input
                                                value={chartTitle}
                                                onChange={(e) => setChartTitle(e.target.value)}
                                                className="mt-1 w-full rounded-lg px-3 py-2 text-body outline-none"
                                                style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)", color: "var(--color-text-primary)" }}
                                            />
                                        </div>

                                        {(["bar", "horizontal-bar", "line", "area"].includes(chartType)) && (
                                            <div className="grid gap-3">
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
                                                    <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>Group By (optional)</label>
                                                    <Select value={groupKey ?? ""} onValueChange={(value) => setGroupKey(value || null)}>
                                                        <SelectTrigger className="mt-1 w-full">
                                                            <SelectValue placeholder="None" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="">None</SelectItem>
                                                            {result.columns.map((col) => (
                                                                <SelectItem key={col.key} value={col.key}>{col.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}

                                        {(["pie", "donut"].includes(chartType)) && (
                                            <div className="grid gap-3">
                                                <div>
                                                    <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>Label</label>
                                                    <Select value={labelKey ?? ""} onValueChange={(value) => setLabelKey(value)}>
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
                                                    <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>Value</label>
                                                    <Select value={valueKey ?? ""} onValueChange={(value) => setValueKey(value)}>
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
                                            </div>
                                        )}

                                        {chartType === "scatter" && (
                                            <div className="grid gap-3">
                                                <div>
                                                    <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>X Axis</label>
                                                    <Select value={xKey ?? ""} onValueChange={(value) => setXKey(value)}>
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
                                                    <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>Group By (optional)</label>
                                                    <Select value={groupKey ?? ""} onValueChange={(value) => setGroupKey(value || null)}>
                                                        <SelectTrigger className="mt-1 w-full">
                                                            <SelectValue placeholder="None" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="">None</SelectItem>
                                                            {result.columns.map((col) => (
                                                                <SelectItem key={col.key} value={col.key}>{col.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}

                                        {chartType === "histogram" && (
                                            <div className="grid gap-3">
                                                <div>
                                                    <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>Value</label>
                                                    <Select value={valueKey ?? ""} onValueChange={(value) => setValueKey(value)}>
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
                                                    <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>Buckets</label>
                                                    <input
                                                        type="number"
                                                        min={3}
                                                        max={30}
                                                        value={bucketCount}
                                                        onChange={(e) => setBucketCount(Math.max(3, parseInt(e.target.value) || 3))}
                                                        className="mt-1 w-full rounded-lg px-3 py-2 text-body outline-none"
                                                        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)", color: "var(--color-text-primary)" }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {chartType === "heatmap" && (
                                            <div className="grid gap-3">
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
                                                    <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>Value</label>
                                                    <Select value={valueKey ?? ""} onValueChange={(value) => setValueKey(value)}>
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
                                            </div>
                                        )}

                                        {chartType === "pivot" && (
                                            <div className="grid gap-3">
                                                <div>
                                                    <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>Rows</label>
                                                    <Select value={pivotRowKey ?? ""} onValueChange={(value) => setPivotRowKey(value)}>
                                                        <SelectTrigger className="mt-1 w-full">
                                                            <SelectValue placeholder="Select row column" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {result.columns.map((col) => (
                                                                <SelectItem key={col.key} value={col.key}>{col.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>Columns</label>
                                                    <Select value={pivotColumnKey ?? ""} onValueChange={(value) => setPivotColumnKey(value)}>
                                                        <SelectTrigger className="mt-1 w-full">
                                                            <SelectValue placeholder="Select column column" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {result.columns.map((col) => (
                                                                <SelectItem key={col.key} value={col.key}>{col.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>Value</label>
                                                    <Select value={pivotValueKey ?? ""} onValueChange={(value) => setPivotValueKey(value)}>
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
                                                    <label className="text-ui-label" style={{ color: "var(--color-text-secondary)" }}>Aggregation</label>
                                                    <Select value={aggregateMode} onValueChange={(value) => setAggregateMode(value as AggregateMode)}>
                                                        <SelectTrigger className="mt-1 w-full">
                                                            <SelectValue placeholder="Select aggregation" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="sum">Sum</SelectItem>
                                                            <SelectItem value="avg">Average</SelectItem>
                                                            <SelectItem value="count">Count</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}

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
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {chartData.error && (
                                        <div
                                            className="rounded-xl p-4 text-body"
                                            style={{ backgroundColor: "var(--color-bg-hover)", border: "1px dashed var(--color-border-default)", color: "var(--color-text-tertiary)" }}
                                        >
                                            {chartData.error}
                                        </div>
                                    )}

                                    {chartType === "pivot" && pivotTable && (
                                        <ChatResultTable data={pivotTable} />
                                    )}

                                    {hasChart && (
                                        <ChartRenderer
                                            type={chartType === "horizontal-bar" ? "horizontal-bar" : chartType}
                                            series={chartData.series ?? []}
                                            categories={chartData.categories}
                                            labels={chartData.labels}
                                            title={chartTitle}
                                            chartId={chartIdRef.current}
                                            colors={palette.colors}
                                            height={320}
                                        />
                                    )}

                                    {hasChart && (
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => handleDownload("PNG")}
                                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-em"
                                                style={{ backgroundColor: "var(--color-bg-hover)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-default)" }}
                                            >
                                                <Download size={14} />
                                                Download PNG
                                            </button>
                                            <button
                                                onClick={() => handleDownload("SVG")}
                                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-em"
                                                style={{ backgroundColor: "var(--color-bg-hover)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-default)" }}
                                            >
                                                <Download size={14} />
                                                Download SVG
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
