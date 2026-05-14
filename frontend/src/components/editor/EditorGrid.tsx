import React, { useEffect, useMemo } from 'react';
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

export function EditorGrid({
  sheetData,
  formattingMap,
  frozenRows,
  frozenCols,
  hotRef,
  onAfterChange
}: EditorGridProps) {

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.debug("[EditorGrid] data", {
      sheetName: sheetData.sheetName,
      rowCount: sheetData.rowCount,
      colCount: sheetData.colCount,
    });
  }, [sheetData.sheetName, sheetData.rowCount, sheetData.colCount]);

  const settings = useMemo(() => {
    const isLarge = sheetData.rowCount > 5000;

    return {
      licenseKey: 'non-commercial-and-evaluation',
      data: sheetData.rows,
      colHeaders: sheetData.columns,
      rowHeaders: true,
      width: '100%',
      height: '100%',
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
  }, [sheetData, formattingMap, frozenRows, frozenCols, onAfterChange]);

  return (
    <div className="absolute inset-0 overflow-hidden" key={sheetData.sheetName}>
      <HotTable
        ref={hotRef}
        {...settings}
      />
    </div>
  );
}
