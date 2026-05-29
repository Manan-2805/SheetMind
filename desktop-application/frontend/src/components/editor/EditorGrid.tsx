import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import UniverPresetSheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US";
import { createUniver, LocaleType, mergeLocales } from "@univerjs/presets";
import { useEffect, useRef } from "react";
import "@univerjs/preset-sheets-core/lib/index.css";
import type { FUniver } from "@univerjs/presets";
import type { CellFormattingMap, SheetData } from "@/types/ExcelEditor";

interface EditorGridProps {
  sheets: SheetData[];
  activeSheetIndex: number;
  formattingMap: CellFormattingMap;
  frozenRows: number;
  frozenCols: number;
  univerRef: React.MutableRefObject<FUniver | null>;
  onWorkbookReady: (univerAPI: FUniver) => void;
  onCellChanged: () => void;
}

function ExcelCellSkeleton() {
  const columns = Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i));
  const rows = Array.from({ length: 25 }, (_, i) => i + 1);

  return (
    <div className="absolute inset-0 overflow-auto bg-bg-base border border-border-default select-none scrollbar-thin animate-pulse">
      <table className="w-full border-collapse table-fixed text-[11px] font-medium text-tertiary">
        <thead>
          <tr className="h-6">
            <th className="w-10 bg-bg-elevated border-b border-r border-border-default sticky top-0 left-0 z-30" />
            {columns.map((col) => (
              <th
                key={col}
                className="w-24 bg-bg-elevated border-b border-r border-border-default text-center align-middle sticky top-0 z-20 font-semibold"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row} className="h-6">
              <td className="bg-bg-elevated border-b border-r border-border-default text-center align-middle font-medium sticky left-0 z-10 w-10 text-xs">
                {row}
              </td>
              {columns.map((col, cIdx) => (
                <td
                  key={`${row}-${col}`}
                  className="bg-bg-base border-b border-r border-border-default px-2 py-1 align-middle"
                >
                  <div
                    className="skeleton h-3.5"
                    style={{
                      width: `${30 + ((row * 7 + cIdx * 13) % 55)}%`,
                      opacity: 0.65,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildWorkbookData(sheets: SheetData[], formattingMap: CellFormattingMap) {
  const sheetsObj: Record<string, unknown> = {};

  sheets.forEach((sheet, sheetIndex) => {
    const sheetId = `sheet_${sheetIndex}`;
    const cellData: Record<number, Record<number, unknown>> = {};

    // 1. Prepend column names as row index 0 in Univer
    cellData[0] = {};
    (sheet.columns || []).forEach((colName, colIndex) => {
      cellData[0][colIndex] = {
        v: colName,
        s: {
          bl: 1, // bold
          ht: 2, // center align
          bg: { rgb: "F3F4F6" }, // background F3F4F6
        },
      };
    });

    // 2. Shift actual data rows to row index 1..N
    (sheet.rows || []).forEach((row, rowIndex) => {
      const univerRowIndex = rowIndex + 1;
      cellData[univerRowIndex] = {};
      row.forEach((cellValue, colIndex) => {
        const key = `${sheet.sheetName}:${rowIndex}:${colIndex}`;
        const fmt = formattingMap[key];

        const cell: Record<string, unknown> = {};

        if (cellValue === null || cellValue === undefined) {
          cell.v = null;
        } else if (typeof cellValue === "string" && cellValue.startsWith("=")) {
          cell.f = cellValue;
        } else {
          cell.v = cellValue;
        }

        if (fmt) {
          const style: Record<string, unknown> = {};
          if (fmt.bold !== undefined) style.bl = fmt.bold ? 1 : 0;
          if (fmt.italic !== undefined) style.it = fmt.italic ? 1 : 0;
          if (fmt.fontSize) style.fs = fmt.fontSize;
          if (fmt.textColor) style.cl = { rgb: fmt.textColor.replace("#", "") };
          if (fmt.bgColor) style.bg = { rgb: fmt.bgColor.replace("#", "") };
          if (fmt.align) {
            const alignMap: Record<string, number> = { left: 1, center: 2, right: 3 };
            style.ht = alignMap[fmt.align];
          }
          if (Object.keys(style).length > 0) cell.s = style;
        }

        cellData[univerRowIndex][colIndex] = cell;
      });
    });

    const columnData: Record<number, { w?: number }> = {};
    (sheet.columns || []).forEach((_, colIndex) => {
      columnData[colIndex] = { w: 120 };
    });

    sheetsObj[sheetId] = {
      id: sheetId,
      name: sheet.sheetName,
      rowCount: Math.max((sheet.rowCount || 0) + 21, 100),
      columnCount: Math.max((sheet.colCount || 0) + 5, 26),
      cellData,
      columnData,
    };
  });

  return {
    id: "sheetmind-workbook",
    sheetOrder: sheets.map((_, i) => `sheet_${i}`),
    sheets: sheetsObj,
    name: "SheetMind Workbook",
    appVersion: "0.0.1",
    locale: LocaleType.EN_US,
  };
}

export function EditorGrid({
  sheets,
  activeSheetIndex,
  formattingMap,
  frozenRows,
  frozenCols,
  univerRef,
  onWorkbookReady,
  onCellChanged,
}: EditorGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!containerRef.current || isInitialized.current) return;
    isInitialized.current = true;

    const { univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
      },
      presets: [
        UniverSheetsCorePreset({
          container: containerRef.current,
          header: true,
          toolbar: true,
          footer: {
            sheetBar: true,
            statisticBar: true,
          },
        }),
      ],
    });

    const workbookData = buildWorkbookData(sheets, formattingMap);
    univerAPI.createWorkbook(workbookData as Parameters<typeof univerAPI.createWorkbook>[0]);

    const workbook = univerAPI.getActiveWorkbook();
    if (workbook && activeSheetIndex > 0) {
      const allSheets = workbook.getSheets();
      if (allSheets[activeSheetIndex]) {
        allSheets[activeSheetIndex].activate();
      }
    }

    if (frozenRows > 0 || frozenCols > 0) {
      const sheet = workbook?.getActiveSheet();
      if (sheet) {
        sheet.setFrozenRows(frozenRows);
        sheet.setFrozenColumns(frozenCols);
      }
    }

    univerAPI.addEvent(univerAPI.Event.SheetValueChanged, () => {
      onCellChanged();
    });

    univerRef.current = univerAPI;
    onWorkbookReady(univerAPI);

    return () => {
      if (univerRef.current) {
        univerAPI.dispose();
        univerRef.current = null;
        isInitialized.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!univerRef.current) return;
    const workbook = univerRef.current.getActiveWorkbook();
    const sheet = workbook?.getActiveSheet();
    if (!sheet) return;
    sheet.setFrozenRows(frozenRows);
    sheet.setFrozenColumns(frozenCols);
  }, [frozenRows, frozenCols, univerRef]);

  if (!sheets || sheets.length === 0) {
    return <ExcelCellSkeleton />;
  }

  return (
    <div
      className="absolute inset-0 univer-container"
      style={{ width: "100%", height: "100%", contain: "strict" }}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
