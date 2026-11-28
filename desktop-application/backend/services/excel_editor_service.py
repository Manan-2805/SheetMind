"""Module containing excel_editor_service functionality."""

import os
import shutil
import uuid
from collections.abc import Callable
from contextlib import closing, contextmanager
from copy import copy
from datetime import UTC, datetime
from pathlib import Path
from tempfile import NamedTemporaryFile
from threading import RLock

import duckdb
import pandas as pd
from openpyxl import load_workbook
from openpyxl.cell import MergedCell
from openpyxl.styles import PatternFill, Side

from schemas.excel_editor_schemas import (
    CellFormatting,
    ExcelEditorFile,
    HistoryRecord,
    SheetData,
)
from schemas.excel_operations import MutationOperation
from services.duckdb_service import get_connection
from services.excel_import_service import import_df_to_duckdb, now_utc, read_excel_frame
from services.excel_mutation_service import Formula, dry_run_mutation
from services.excel_workbook_service import (
    AxisEdit,
    comparable,
    infer_origins,
    read_sheet,
    reshape,
    update_cell,
)
from services.logging_service import get_logger
from services.storage_service import get_backups_dir


def get_available_files() -> list[ExcelEditorFile]:
    """Execute the get_available_files operation."""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT id, original_filename, num_sheets, file_size_bytes, uploaded_at, stored_path
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
            editable=_is_editable(row[1], row[5]),
            fileSizeBytes=row[3] or 0,
            uploadedAt=row[4],
        )
        for row in rows
    ]


def get_hex_color(color_obj) -> str | None:
    """Execute the get_hex_color operation."""
    if color_obj is None:
        return None
    try:
        if color_obj.type == "rgb" and color_obj.rgb:
            rgb_str = str(color_obj.rgb)
            if len(rgb_str) >= 6:
                return "#" + rgb_str[-6:]
        return None
    except Exception:
        return None


def extract_formatting_map(path: str) -> dict[str, dict]:
    """Execute the extract_formatting_map operation."""
    formatting_map = {}
    try:
        with closing(load_workbook(path, read_only=False, data_only=True)) as wb:
            for sheet_name in wb.sheetnames:
                ws = wb[sheet_name]
                max_r = min(ws.max_row, 1000)
                max_c = min(ws.max_column, 100)
                for r in range(2, max_r + 1):
                    r_idx = r - 2
                    for c in range(1, max_c + 1):
                        c_idx = c - 1
                        cell = ws.cell(row=r, column=c)
                        bold = cell.font.bold if cell.font else None
                        italic = cell.font.italic if cell.font else None
                        font_size = int(cell.font.size) if cell.font and cell.font.size else None
                        text_color = None
                        if cell.font and cell.font.color:
                            text_color = get_hex_color(cell.font.color)
                        bg_color = None
                        if (
                            cell.fill
                            and isinstance(cell.fill, PatternFill)
                            and cell.fill.fill_type not in (None, "none")
                        ):
                            bg_color = get_hex_color(cell.fill.fgColor)
                        border_top = (
                            cell.border.top.style is not None
                            if cell.border and cell.border.top
                            else None
                        )
                        border_bottom = (
                            cell.border.bottom.style is not None
                            if cell.border and cell.border.bottom
                            else None
                        )
                        border_left = (
                            cell.border.left.style is not None
                            if cell.border and cell.border.left
                            else None
                        )
                        border_right = (
                            cell.border.right.style is not None
                            if cell.border and cell.border.right
                            else None
                        )
                        align = None
                        if cell.alignment and cell.alignment.horizontal in (
                            "left",
                            "center",
                            "right",
                        ):
                            align = cell.alignment.horizontal
                        has_format = (
                            bold
                            or italic
                            or font_size
                            or text_color
                            or bg_color
                            or align
                            or border_top
                            or border_bottom
                            or border_left
                            or border_right
                        )
                        if has_format:
                            key = f"{sheet_name}:{r_idx}:{c_idx}"
                            fmt_dict = {}
                            if bold is not None:
                                fmt_dict["bold"] = bold
                            if italic is not None:
                                fmt_dict["italic"] = italic
                            if font_size is not None:
                                fmt_dict["fontSize"] = font_size
                            if text_color is not None:
                                fmt_dict["textColor"] = text_color
                            if bg_color is not None:
                                fmt_dict["bgColor"] = bg_color
                            if border_top is not None:
                                fmt_dict["borderTop"] = border_top
                            if border_bottom is not None:
                                fmt_dict["borderBottom"] = border_bottom
                            if border_left is not None:
                                fmt_dict["borderLeft"] = border_left
                            if border_right is not None:
                                fmt_dict["borderRight"] = border_right
                            if align is not None:
                                fmt_dict["align"] = align
                            formatting_map[key] = fmt_dict
    except Exception as e:
        get_logger().error("Error extracting formatting map: %s", e)
    return formatting_map


class EditorError(ValueError):
    """A workbook error with an HTTP status appropriate for API callers."""

    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code


_FILE_LOCKS = tuple(RLock() for _ in range(32))


def _is_editable(filename: str, stored_path: str) -> bool:
    return Path(filename).suffix.lower() == Path(stored_path).suffix.lower() == ".xlsx"


def _editable_file(conn: duckdb.DuckDBPyConnection, file_id: str) -> tuple[str, Path]:
    row = conn.execute(
        "SELECT original_filename, stored_path FROM excel_files WHERE id = ?", [file_id]
    ).fetchone()
    if not row:
        raise EditorError(404, "File not found")
    filename, stored_path = row
    if not _is_editable(filename, stored_path):
        raise EditorError(400, "Only .xlsx files are editable")
    path = Path(stored_path).resolve()
    if not path.is_file():
        raise EditorError(404, "Workbook file not found")
    return filename, path


def _workbook_sheet(workbook, sheet_name: str):
    if sheet_name not in workbook.sheetnames:
        raise EditorError(404, "Sheet not found")
    return workbook[sheet_name]


def open_excel_file(file_id: str) -> dict:
    """Open an editable workbook and load the first sheet."""
    with get_connection() as conn:
        filename, path = _editable_file(conn, file_id)
        metadata = conn.execute(
            "SELECT sheet_name, row_count, col_count FROM excel_sheets WHERE excel_file_id = ?",
            [file_id],
        ).fetchall()
    counts = {name: (rows, columns) for name, rows, columns in metadata}
    with closing(load_workbook(path)) as workbook:
        first, *other_sheets = workbook.worksheets
        sheets = [read_sheet(first)]
        for sheet in other_sheets:
            row_count, column_count = counts.get(sheet.title, (0, 0))
            sheets.append(
                SheetData(sheetName=sheet.title, rowCount=row_count, colCount=column_count)
            )
    return {
        "fileId": file_id,
        "filename": filename,
        "sheets": sheets,
        "formattingMap": extract_formatting_map(str(path)),
    }


def open_excel_sheet(file_id: str, sheet_name: str) -> SheetData:
    """Read a workbook sheet with its stored values and formula locations."""
    with get_connection() as conn:
        _, path = _editable_file(conn, file_id)
    with closing(load_workbook(path)) as workbook:
        return read_sheet(_workbook_sheet(workbook, sheet_name))


def get_workbook_download(file_id: str) -> tuple[str, Path]:
    """Find the saved workbook in the requesting profile."""
    with get_connection() as conn:
        return _editable_file(conn, file_id)


def _sheet_values(data: SheetData, *, legacy_formulas: bool = False) -> list[list]:
    positions = set(data.formulaCells or [])
    return [
        [
            Formula(value)
            if isinstance(value, str)
            and value.startswith("=")
            and (f"{row}:{col}" in positions or (legacy_formulas and data.formulaCells is None))
            else value
            for col, value in enumerate(values)
        ]
        for row, values in enumerate(data.rows or [])
    ]


def _verified_frame(data: SheetData, row_count: int, columns: list[str]) -> pd.DataFrame:
    if data.rowCount != row_count or data.columns != columns:
        raise EditorError(409, "Save your manual edits first")
    return pd.DataFrame(_sheet_values(data), columns=columns, dtype=object)


def load_mutation_frame(
    file_id: str, sheet_name: str, row_count: int, columns: list[str]
) -> pd.DataFrame:
    """Load AI preview data from the saved workbook after checking its shape."""
    return _verified_frame(open_excel_sheet(file_id, sheet_name), row_count, columns)


def _backup_dir_path(stored_backup: str) -> Path:
    root = get_backups_dir().resolve()
    path = Path(stored_backup).resolve()
    if not path.is_relative_to(root):
        raise EditorError(400, "Backup path is outside the backups directory")
    return path


def _create_backup(file_id: str, path: Path) -> Path:
    filename = f"{file_id}_{datetime.now(UTC):%Y%m%d_%H%M%S_%f}_{uuid.uuid4().hex[:6]}{path.suffix}"
    backup = get_backups_dir() / filename
    shutil.copy2(path, backup)
    return backup


def _prune_backups(conn: duckdb.DuckDBPyConnection, file_id: str) -> None:
    rows = conn.execute(
        "SELECT backup_path FROM edit_history WHERE excel_file_id = ? ORDER BY applied_at DESC, id DESC",
        [file_id],
    ).fetchall()
    backups = set()
    for (path,) in rows:
        try:
            backup = _backup_dir_path(path)
            if backup in backups or not backup.is_file():
                continue
            backups.add(backup)
            if len(backups) > 20:
                backup.unlink(missing_ok=True)
        except (EditorError, OSError) as exc:
            get_logger().warning("Could not prune an editor backup: %s", type(exc).__name__)


@contextmanager
def _temporary_workbook(path: Path):
    with NamedTemporaryFile(dir=path.parent, suffix=path.suffix, delete=False) as file:
        temporary = Path(file.name)
    try:
        yield temporary
    finally:
        temporary.unlink(missing_ok=True)


def _publish(
    conn: duckdb.DuckDBPyConnection,
    file_id: str,
    path: Path,
    write: Callable[[Path], None],
    *,
    sheets: list[str],
    operation_type: str,
    rows_affected: int,
) -> None:
    with _temporary_workbook(path) as staged:
        write(staged)
        backup = _create_backup(file_id, path)
        replaced = False
        conn.execute("BEGIN TRANSACTION")
        try:
            for name in sheets:
                refresh_duckdb_sheet(conn, file_id, name, staged)
            conn.execute(
                "INSERT INTO edit_history (id, excel_file_id, sheet_name, operation_type, "
                "rows_affected, applied_at, backup_path) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    f"hist-{uuid.uuid4().hex[:8]}",
                    file_id,
                    ", ".join(sheets),
                    operation_type,
                    rows_affected,
                    now_utc(),
                    str(backup),
                ],
            )
            os.replace(staged, path)
            replaced = True
            conn.commit()
        except Exception:
            conn.rollback()
            if replaced:
                with _temporary_workbook(path) as rollback:
                    shutil.copy2(backup, rollback)
                    os.replace(rollback, path)
            backup.unlink(missing_ok=True)
            raise
    _prune_backups(conn, file_id)


def apply_mutation_to_disk(
    file_id: str,
    sheet_name: str,
    operations: list[MutationOperation],
    current_rows: list[list],
    columns: list[str],
):
    """Apply validated operations to the saved workbook and preserve cell styles."""
    with get_connection() as conn:
        _, path = _editable_file(conn, file_id)
        lock = _FILE_LOCKS[hash(path) % len(_FILE_LOCKS)]
        with lock, closing(load_workbook(path)) as workbook:
            sheet = _workbook_sheet(workbook, sheet_name)
            original = _verified_frame(read_sheet(sheet), len(current_rows), columns)
            diffs, updated = dry_run_mutation(original, operations)
            old_cols = {column: index for index, column in enumerate(columns, 1)}
            col_origins = [old_cols.get(name) for name in updated.attrs["column_origins"].values()]
            row_origins = [1, *(row + 2 if row < len(original) else None for row in updated.index)]
            reshape(
                sheet, AxisEdit(len(original) + 1, row_origins), AxisEdit(len(columns), col_origins)
            )
            for col, (name, origin) in enumerate(zip(updated.columns, col_origins, strict=True), 1):
                if origin is None:
                    update_cell(sheet, 1, col, name)
            for row_index, values in enumerate(updated.itertuples(index=False, name=None), 2):
                for col_index, value in enumerate(values, 1):
                    update_cell(sheet, row_index, col_index, value)
            _publish(
                conn,
                file_id,
                path,
                workbook.save,
                sheets=[sheet_name],
                operation_type="ai_mutation",
                rows_affected=len({row["rowIndex"] for row in diffs}),
            )


def apply_cell_formatting(cell, fmt: CellFormatting):
    """Execute the apply_cell_formatting operation."""
    if isinstance(cell, MergedCell):
        return
    font = copy(cell.font)
    for prop, update in (("bold", fmt.bold), ("italic", fmt.italic), ("size", fmt.fontSize)):
        if update is not None:
            setattr(font, prop, update)
    if fmt.textColor and fmt.textColor.lower() != (get_hex_color(font.color) or "").lower():
        font.color = fmt.textColor.lstrip("#")
    if font != cell.font:
        cell.font = font
    if fmt.bgColor and fmt.bgColor.lower() != (get_hex_color(cell.fill.fgColor) or "").lower():
        cell.fill = PatternFill(fill_type="solid", fgColor=fmt.bgColor.lstrip("#"))
    border = copy(cell.border)
    for prop, update in (
        ("top", fmt.borderTop),
        ("bottom", fmt.borderBottom),
        ("left", fmt.borderLeft),
        ("right", fmt.borderRight),
    ):
        if update is None:
            continue
        current = getattr(border, prop)
        if update != bool(current and current.style):
            setattr(border, prop, Side(style="thin") if update else None)
    if border != cell.border:
        cell.border = border
    if fmt.align and fmt.align != cell.alignment.horizontal:
        alignment = copy(cell.alignment)
        alignment.horizontal = fmt.align
        cell.alignment = alignment


def save_manual_edits(
    file_id: str, sheets: list[SheetData], formatting_map: dict[str, CellFormatting]
):
    """Save edited cells and intentional formatting changes to a staged workbook."""
    with get_connection() as conn:
        _, path = _editable_file(conn, file_id)
        lock = _FILE_LOCKS[hash(path) % len(_FILE_LOCKS)]
        with lock, closing(load_workbook(path)) as workbook:
            modified = []
            for data in sheets:
                if data.columns is None or data.rows is None:
                    continue
                if any(len(row) != len(data.columns) for row in data.rows):
                    raise EditorError(400, "Every row must match the worksheet columns")
                sheet = _workbook_sheet(workbook, data.sheetName)
                original = read_sheet(sheet)
                values = _sheet_values(data, legacy_formulas=True)
                rows = [tuple(map(comparable, row)) for row in original.rows or []]
                incoming = [tuple(map(comparable, row)) for row in values]
                old_columns = original.columns or []
                if (
                    rows == incoming
                    and old_columns == data.columns
                    and (data.formulaCells or []) == (original.formulaCells or [])
                ):
                    continue
                try:
                    row_origins = infer_origins(rows, incoming, 2)
                except TypeError as exc:
                    raise EditorError(400, "Unsupported worksheet cell value") from exc
                column_origins = infer_origins(old_columns, data.columns, 1)
                reshape(
                    sheet,
                    AxisEdit(original.rowCount + 1, [1, *row_origins]),
                    AxisEdit(original.colCount, column_origins),
                )
                for col, (name, old) in enumerate(
                    zip(data.columns, column_origins, strict=True), 1
                ):
                    if old is None or name != old_columns[old - 1]:
                        update_cell(sheet, 1, col, name)
                for row, cells in enumerate(values, 2):
                    for col, value in enumerate(cells, 1):
                        update_cell(sheet, row, col, value)
                modified.append(data.sheetName)

            for key, formatting in formatting_map.items():
                sheet_name, row, col = key.rsplit(":", 2)
                sheet = _workbook_sheet(workbook, sheet_name)
                cell = sheet.cell(int(row) + 2, int(col) + 1)
                apply_cell_formatting(cell, formatting)

            if modified or formatting_map:
                _publish(
                    conn,
                    file_id,
                    path,
                    workbook.save,
                    sheets=modified,
                    operation_type="manual",
                    rows_affected=0,
                )


def refresh_duckdb_sheet(
    conn: duckdb.DuckDBPyConnection, file_id: str, sheet_name: str, file_path: Path
):
    """Execute the refresh_duckdb_sheet operation."""
    # Get table name
    row = conn.execute(
        "SELECT table_name FROM excel_sheets WHERE excel_file_id = ? AND sheet_name = ?",
        [file_id, sheet_name],
    ).fetchone()

    if not row:
        return

    table_name = row[0]

    # Import evaluated values (data_only=True)
    with pd.ExcelFile(file_path, engine="openpyxl") as workbook:
        df = read_excel_frame(workbook, sheet_name)
    import_df_to_duckdb(conn, df, table_name)

    # Update row/col count in excel_sheets
    conn.execute(
        "UPDATE excel_sheets SET row_count = ?, col_count = ?, imported_at = ? WHERE excel_file_id = ? AND sheet_name = ?",
        [len(df), len(df.columns), now_utc(), file_id, sheet_name],
    )


def get_edit_history(file_id: str) -> list[HistoryRecord]:
    """Execute the get_edit_history operation."""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT id, sheet_name, operation_type, rows_affected, applied_at
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
        )
        for r in rows
    ]


def restore_backup(file_id: str, history_id: str):
    """Restore an in-directory backup belonging to the selected file and revision."""
    with get_connection() as conn:
        _, path = _editable_file(conn, file_id)
        lock = _FILE_LOCKS[hash(path) % len(_FILE_LOCKS)]
        with lock:
            row = conn.execute(
                "SELECT backup_path FROM edit_history WHERE excel_file_id = ? AND id = ?",
                [file_id, history_id],
            ).fetchone()
            if not row:
                raise EditorError(404, "Backup file not found for this history entry")
            backup = _backup_dir_path(row[0])
            if not backup.is_file():
                raise EditorError(404, "Backup file not found")
            sheets = conn.execute(
                "SELECT sheet_name FROM excel_sheets WHERE excel_file_id = ?", [file_id]
            ).fetchall()
            _publish(
                conn,
                file_id,
                path,
                lambda staged: shutil.copy2(backup, staged),
                sheets=[name for (name,) in sheets],
                operation_type="restore",
                rows_affected=0,
            )
