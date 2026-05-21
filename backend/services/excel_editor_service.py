import os
import shutil
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

import pandas as pd
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

from schemas.excel_editor_schemas import CellFormatting, ExcelEditorFile, HistoryRecord, SheetData
from services.duckdb_service import get_connection
from services.excel_import_service import import_df_to_duckdb, now_utc, safe_table_name
from services.storage_service import get_backups_dir

def get_available_files() -> list[ExcelEditorFile]:
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT id, original_filename, num_sheets, file_size_bytes, uploaded_at
        FROM excel_files
        WHERE status = 'completed'
        ORDER BY uploaded_at DESC
        """
    ).fetchall()
    
    return [
        ExcelEditorFile(
            fileId=row[0],
            filename=row[1],
            sheetCount=row[2] or 0,
            fileSizeBytes=row[3] or 0,
            uploadedAt=row[4]
        )
        for row in rows
    ]

def open_excel_file(file_id: str) -> Optional[dict]:
    conn = get_connection()
    file_row = conn.execute(
        "SELECT original_filename, stored_path FROM excel_files WHERE id = ?",
        [file_id]
    ).fetchone()
    
    if not file_row:
        return None
        
    filename, path = file_row
    
    try:
        xl = pd.ExcelFile(path)
        sheet_names = xl.sheet_names
    except Exception as e:
        print(f"Error reading excel sheets: {e}")
        return None
    
    sheets = []
    for idx, sheet_name in enumerate(sheet_names):
        if idx == 0:
            try:
                df = xl.parse(sheet_name)
                df_clean = df.replace({float('nan'): None, float('inf'): None, float('-inf'): None})
                sheets.append(SheetData(
                    sheetName=sheet_name,
                    columns=df_clean.columns.tolist(),
                    rows=df_clean.values.tolist(),
                    rowCount=len(df_clean),
                    colCount=len(df_clean.columns)
                ))
            except Exception as e:
                print(f"Error parsing first sheet {sheet_name}: {e}")
                sheets.append(SheetData(
                    sheetName=sheet_name,
                    columns=[],
                    rows=[],
                    rowCount=0,
                    colCount=0
                ))
        else:
            row_count, col_count = 0, 0
            sheet_row = conn.execute(
                "SELECT row_count, col_count FROM excel_sheets WHERE excel_file_id = ? AND sheet_name = ?",
                [file_id, sheet_name]
            ).fetchone()
            if sheet_row:
                row_count, col_count = sheet_row[0], sheet_row[1]
            sheets.append(SheetData(
                sheetName=sheet_name,
                columns=None,
                rows=None,
                rowCount=row_count,
                colCount=col_count
            ))
            
    return {
        "fileId": file_id,
        "filename": filename,
        "sheets": sheets
    }

def open_excel_sheet(file_id: str, sheet_name: str) -> Optional[SheetData]:
    conn = get_connection()
    file_row = conn.execute(
        "SELECT stored_path FROM excel_files WHERE id = ?",
        [file_id]
    ).fetchone()
    
    if not file_row:
        return None
        
    path = file_row[0]
    try:
        xl = pd.ExcelFile(path)
        if sheet_name not in xl.sheet_names:
            return None
            
        df = xl.parse(sheet_name)
        df_clean = df.replace({float('nan'): None, float('inf'): None, float('-inf'): None})
        
        return SheetData(
            sheetName=sheet_name,
            columns=df_clean.columns.tolist(),
            rows=df_clean.values.tolist(),
            rowCount=len(df_clean),
            colCount=len(df_clean.columns)
        )
    except Exception as e:
        print(f"Error opening sheet {sheet_name}: {e}")
        return None

def create_backup(stored_path: str, filename: str) -> str:
    backup_dir = get_backups_dir()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    # Extract only the base name to avoid nested folder structure issues in backups
    base_name = os.path.basename(filename)
    backup_filename = f"{os.path.splitext(base_name)[0]}_{timestamp}.xlsx"
    backup_path = str(backup_dir / backup_filename)
    os.makedirs(os.path.dirname(backup_path), exist_ok=True)
    shutil.copy2(stored_path, backup_path)
    return backup_path

def record_edit_history(
    excel_file_id: str,
    sheet_name: str,
    operation_type: str,
    rows_affected: int,
    backup_path: str,
):
    conn = get_connection()
    history_id = f"hist-{uuid.uuid4().hex[:8]}"
    conn.execute(
        """
        INSERT INTO edit_history
        (id, excel_file_id, sheet_name, operation_type, rows_affected, applied_at, backup_path)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        [history_id, excel_file_id, sheet_name, operation_type, rows_affected, now_utc(), backup_path],
    )

def apply_mutation_to_disk(
    file_id: str,
    sheet_name: str,
    pandas_code: str,
    current_rows: list[list],
    columns: list[str]
):
    conn = get_connection()
    file_row = conn.execute(
        "SELECT original_filename, stored_path FROM excel_files WHERE id = ?",
        [file_id]
    ).fetchone()
    
    if not file_row:
        raise ValueError("File not found")
        
    filename, path = file_row
    
    # 1. Create backup
    backup_path = create_backup(path, filename)
    
    # 2. Reconstruct DF and apply mutation
    df = pd.DataFrame(current_rows, columns=columns)
    local_vars = {"df": df, "pd": pd}
    exec(pandas_code, {"__builtins__": {}}, local_vars)
    df_modified = local_vars["df"]
    
    # 3. Write back to disk using openpyxl for the target sheet
    # preserve_all_formatting=True to keep other sheets/formatting
    wb = load_workbook(path)
    if sheet_name not in wb.sheetnames:
        raise ValueError(f"Sheet {sheet_name} not found in workbook")
        
    ws = wb[sheet_name]
    
    # Clear existing data in the target sheet
    # We'll just overwrite from row 1, col 1
    # First, let's find the max dimensions
    ws.delete_rows(1, ws.max_row)
    
    # Write headers
    for c_idx, col_name in enumerate(df_modified.columns, 1):
        ws.cell(row=1, column=c_idx, value=col_name)
        
    # Write data
    for r_idx, row in enumerate(df_modified.values, 2):
        for c_idx, value in enumerate(row, 1):
            if isinstance(value, str) and value.startswith('='):
                ws.cell(row=r_idx, column=c_idx, value=value)
            else:
                # Handle NaN
                cell_val = None if pd.isna(value) else value
                ws.cell(row=r_idx, column=c_idx, value=cell_val)
                
    wb.save(path)
    
    # 4. Record history
    record_edit_history(file_id, sheet_name, "ai_mutation", len(df_modified), backup_path)
    
    # 5. Refresh DuckDB
    refresh_duckdb_sheet(file_id, sheet_name, path)

def apply_cell_formatting(cell, fmt: CellFormatting):
    if fmt.bold is not None or fmt.italic is not None or fmt.fontSize is not None or fmt.textColor is not None:
        cell.font = Font(
            bold=fmt.bold if fmt.bold is not None else (cell.font.bold if cell.font else False),
            italic=fmt.italic if fmt.italic is not None else (cell.font.italic if cell.font else False),
            size=fmt.fontSize if fmt.fontSize is not None else (cell.font.size if cell.font else 11),
            color=fmt.textColor.lstrip('#') if fmt.textColor else (cell.font.color.rgb if cell.font and cell.font.color else '000000'),
        )
    if fmt.bgColor:
        cell.fill = PatternFill(
            fill_type='solid',
            fgColor=fmt.bgColor.lstrip('#')
        )
    if any(x is not None for x in [fmt.borderTop, fmt.borderBottom, fmt.borderLeft, fmt.borderRight]):
        side = Side(style='thin')
        current_border = cell.border
        cell.border = Border(
            top=side if fmt.borderTop else (current_border.top if current_border and not fmt.borderTop is False else None),
            bottom=side if fmt.borderBottom else (current_border.bottom if current_border and not fmt.borderBottom is False else None),
            left=side if fmt.borderLeft else (current_border.left if current_border and not fmt.borderLeft is False else None),
            right=side if fmt.borderRight else (current_border.right if current_border and not fmt.borderRight is False else None),
        )
    if fmt.align:
        cell.alignment = Alignment(horizontal=fmt.align)

def save_manual_edits(
    file_id: str,
    sheets: list[SheetData],
    formatting_map: dict[str, CellFormatting]
):
    conn = get_connection()
    file_row = conn.execute(
        "SELECT original_filename, stored_path FROM excel_files WHERE id = ?",
        [file_id]
    ).fetchone()
    
    if not file_row:
        raise ValueError("File not found")
        
    filename, path = file_row
    
    # 1. Create backup
    create_backup(path, filename)
    
    # 2. Load with openpyxl
    wb = load_workbook(path)
    
    modified_sheet_names = []
    for sheet_data in sheets:
        if sheet_data.sheetName not in wb.sheetnames:
            continue
        
        ws = wb[sheet_data.sheetName]
        modified_sheet_names.append(sheet_data.sheetName)
        
        # Clear and overwrite
        ws.delete_rows(1, ws.max_row)
        
        # Headers
        for c_idx, col_name in enumerate(sheet_data.columns, 1):
            ws.cell(row=1, column=c_idx, value=col_name)
            
        # Rows
        for r_idx, row in enumerate(sheet_data.rows, 2):
            for c_idx, value in enumerate(row, 1):
                if isinstance(value, str) and value.startswith('='):
                    ws.cell(row=r_idx, column=c_idx, value=value)
                else:
                    cell_val = None if pd.isna(value) else value
                    ws.cell(row=r_idx, column=c_idx, value=cell_val)
                    
    # 3. Apply formatting
    for key, fmt in formatting_map.items():
        # key format: "SheetName:rowIndex:colIndex"
        parts = key.split(":")
        if len(parts) != 3:
            continue
        s_name, r_idx, c_idx = parts[0], int(parts[1]), int(parts[2])
        
        if s_name in wb.sheetnames:
            ws = wb[s_name]
            # openpyxl is 1-indexed, headers are at row 1, so r_idx 0 is row 2
            cell = ws.cell(row=r_idx + 2, column=c_idx + 1)
            apply_cell_formatting(cell, fmt)
            
    wb.save(path)
    
    # 4. Refresh DuckDB
    for s_name in modified_sheet_names:
        refresh_duckdb_sheet(file_id, s_name, path)

def refresh_duckdb_sheet(file_id: str, sheet_name: str, file_path: str):
    conn = get_connection()
    # Get table name
    row = conn.execute(
        "SELECT table_name FROM excel_sheets WHERE excel_file_id = ? AND sheet_name = ?",
        [file_id, sheet_name]
    ).fetchone()
    
    if not row:
        return
        
    table_name = row[0]
    
    # Import evaluated values (data_only=True)
    df = pd.read_excel(file_path, sheet_name=sheet_name, engine='openpyxl', engine_kwargs={'data_only': True})
    import_df_to_duckdb(conn, df, table_name)
    
    # Update row/col count in excel_sheets
    conn.execute(
        "UPDATE excel_sheets SET row_count = ?, col_count = ?, imported_at = ? WHERE excel_file_id = ? AND sheet_name = ?",
        [len(df), len(df.columns), now_utc(), file_id, sheet_name]
    )

def get_edit_history(file_id: str) -> list[HistoryRecord]:
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT id, sheet_name, operation_type, rows_affected, applied_at, backup_path
        FROM edit_history
        WHERE excel_file_id = ?
        ORDER BY applied_at DESC
        """,
        [file_id],
    ).fetchall()

    return [
        HistoryRecord(
            id=r[0],
            sheetName=r[1],
            operationType=r[2],
            rowsAffected=r[3],
            appliedAt=r[4],
            backupPath=r[5],
        )
        for r in rows
    ]

def restore_backup(file_id: str, backup_path: str):
    conn = get_connection()
    file_row = conn.execute(
        "SELECT stored_path FROM excel_files WHERE id = ?",
        [file_id]
    ).fetchone()
    
    if not file_row:
        raise ValueError("File not found")
        
    stored_path = file_row[0]
    
    if not os.path.exists(backup_path):
        raise ValueError("Backup file not found")
        
    # Overwrite
    shutil.copy2(backup_path, stored_path)
    
    # Re-import all sheets
    sheets = conn.execute(
        "SELECT sheet_name FROM excel_sheets WHERE excel_file_id = ?",
        [file_id]
    ).fetchall()
    
    for s_row in sheets:
        refresh_duckdb_sheet(file_id, s_row[0], stored_path)
