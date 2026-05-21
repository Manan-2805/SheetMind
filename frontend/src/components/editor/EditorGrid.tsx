import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.min.css';
import type { HotTableClass } from '@handsontable/react';
import type { SheetData, CellFormattingMap } from '@/types/ExcelEditor';

// Register all Handsontable modules
registerAllModules();

interface EditorGridProps {
  sheetData: SheetData;
  formattingMap: CellFormattingMap;
  frozenRows: number;
  frozenCols: number;
  hotRef: React.RefObject<HotTableClass>;
  onAfterChange: (changes: unknown[] | null, source: string) => void;
}

function ExcelCellSkeleton() {
  const columns = Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i)); // A to L
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
                      width: `${30 + (row * 7 + cIdx * 13) % 55}%`,
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

export function EditorGrid({
  sheetData,
  formattingMap,
  frozenRows,
  frozenCols,
  hotRef,
  onAfterChange
}: EditorGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === el) {
          const h = el.offsetHeight;
          if (h > 0) {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
              setContainerHeight(h);
            }, 80);
          }
        }
      }
    });

    observer.observe(el);
    const initialH = el.offsetHeight;
    if (initialH > 0) {
      setContainerHeight(initialH);
    }

    return () => {
      observer.disconnect();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [sheetData.sheetName]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.debug("[EditorGrid] data", {
      sheetName: sheetData.sheetName,
      rowCount: sheetData.rowCount,
      colCount: sheetData.colCount,
    });
  }, [sheetData.sheetName, sheetData.rowCount, sheetData.colCount]);

  const settings = useMemo(() => {
    const isLarge = sheetData.rowCount > 1000;

    return {
      licenseKey: 'non-commercial-and-evaluation',
      data: sheetData.rows || [],
      colHeaders: sheetData.columns || [],
      rowHeaders: true,
      width: '100%',
      height: containerHeight,
      stretchH: 'all' as const,
      manualRowResize: true,
      manualColumnResize: true,
      contextMenu: true,
      filters: true,
      dropdownMenu: true,
      columnSorting: true,
      autoWrapRow: true,
      autoWrapCol: true,
      fixedRowsTop: frozenRows,
      fixedColumnsStart: frozenCols,
      viewportRowRenderingOffset: isLarge ? 10 : 'auto' as const,
      viewportColumnRenderingOffset: isLarge ? 5 : 'auto' as const,
      renderAllRows: !isLarge,
      afterChange: onAfterChange,
      cells: (row: number, col: number) => {
        const key = `${sheetData.sheetName}:${row}:${col}`;
        const fmt = formattingMap[key];
        if (!fmt) return {};

        return {
          renderer: (instance: unknown, td: HTMLTableCellElement, row: number, col: number, prop: string | number, value: unknown, cellProperties: unknown) => {
            const hot = instance as { getRenderer: (name: string) => (i: unknown, t: HTMLElement, r: number, c: number, p: string | number, v: unknown, cp: unknown) => void };
            (hot.getRenderer('text'))(instance, td, row, col, prop, value, cellProperties);

            // Apply custom styles
            if (fmt.bold) td.style.fontWeight = 'bold';
            if (fmt.italic) td.style.fontStyle = 'italic';
            if (fmt.fontSize) td.style.fontSize = `${fmt.fontSize}pt`;
            if (fmt.textColor) td.style.color = fmt.textColor;
            if (fmt.bgColor) td.style.backgroundColor = fmt.bgColor;
            if (fmt.align) td.style.textAlign = fmt.align;

            if (fmt.borderTop) td.style.borderTop = '1px solid var(--color-border-default)';
            if (fmt.borderBottom) td.style.borderBottom = '1px solid var(--color-border-default)';
            if (fmt.borderLeft) td.style.borderLeft = '1px solid var(--color-border-default)';
            if (fmt.borderRight) td.style.borderRight = '1px solid var(--color-border-default)';

            return td;
          }
        };
      }
    };
  }, [sheetData, formattingMap, frozenRows, frozenCols, onAfterChange, containerHeight]);

  if (!sheetData.rows || !sheetData.columns) {
    return <ExcelCellSkeleton />;
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" key={sheetData.sheetName}>
      <HotTable
        ref={hotRef}
        {...settings}
      />
    </div>
  );
}

