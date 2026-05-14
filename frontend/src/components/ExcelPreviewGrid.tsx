import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

import type { ResultTable } from "@/types/ChatMessage";
import { useTheme } from "@/hooks/useTheme";

interface ExcelPreviewGridProps {
    result: ResultTable;
}

export function ExcelPreviewGrid({ result }: ExcelPreviewGridProps) {
    const { resolvedTheme } = useTheme();

    const columnDefs = useMemo(() => {
        return result.columns.map((col) => ({
            field: col.key,
            headerName: col.label,
            sortable: true,
            filter: true,
            resizable: true,
            minWidth: 100,
        }));
    }, [result.columns]);

    const defaultColDef = useMemo(() => ({
        flex: 1,
        minWidth: 100,
    }), []);

    return (
        <div 
            className={`w-full h-full ${resolvedTheme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'}`}
            style={{ 
                '--ag-background-color': 'var(--color-bg-base)',
                '--ag-header-background-color': 'var(--color-bg-elevated)',
                '--ag-border-color': 'var(--color-border-default)',
                '--ag-row-border-color': 'var(--color-border-subtle)',
                '--ag-odd-row-background-color': 'var(--color-bg-hover)',
            } as React.CSSProperties}
        >
            <AgGridReact
                rowData={result.rows}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                animateRows={true}
            />
        </div>
    );
}
