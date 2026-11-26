"""Read and update OpenPyXL worksheets while retaining existing cell metadata."""

from bisect import bisect_left, bisect_right
from collections.abc import Callable
from copy import copy
from dataclasses import dataclass
from datetime import date, datetime, time
from difflib import SequenceMatcher
from functools import cached_property
from itertools import groupby
from typing import Any

from openpyxl.cell import MergedCell
from openpyxl.formatting.formatting import ConditionalFormattingList
from openpyxl.utils.cell import column_index_from_string, get_column_letter
from openpyxl.worksheet.cell_range import CellRange
from openpyxl.worksheet.worksheet import Worksheet

from schemas.excel_editor_schemas import SheetData
from services.excel_mutation_service import Formula


def _column_names(headers: list[Any]) -> list[str]:
    names: list[str] = []
    used: set[str] = set()
    for position, header in enumerate(headers, 1):
        base = str(header) if header is not None else f"Column {position}"
        name = base
        suffix = 1
        while name in used:
            name = f"{base}.{suffix}"
            suffix += 1
        used.add(name)
        names.append(name)
    return names


def _cell_value(cell) -> Any:
    if cell.data_type == "f" and isinstance(cell.value, str):
        return Formula(cell.value)
    return cell.value


def read_sheet(ws: Worksheet) -> SheetData:
    """Read visible sheet dimensions and values, keeping formulas explicit."""
    # Formatted cells can extend far beyond the data. Walk only stored cells.
    populated = [cell for cell in ws._cells.values() if cell.value is not None]
    last_column = max((cell.column for cell in populated), default=0)
    last_row = max((cell.row for cell in populated), default=1)
    headers = [_cell_value(ws.cell(1, column)) for column in range(1, last_column + 1)]
    rows = [
        [_cell_value(ws.cell(row, col)) for col in range(1, last_column + 1)]
        for row in range(2, last_row + 1)
    ]
    return SheetData(
        sheetName=ws.title,
        columns=_column_names(headers),
        rows=rows,
        rowCount=len(rows),
        colCount=last_column,
        formulaCells=[
            f"{row}:{col}"
            for row, values in enumerate(rows)
            for col, value in enumerate(values)
            if isinstance(value, Formula)
        ],
    )


@dataclass
class AxisEdit:
    """Map an old worksheet axis to the new one using one-based cell coordinates."""

    old_length: int
    origins: list[int | None]

    @cached_property
    def mapping(self) -> dict[int, int]:
        """Return the new position of each retained cell coordinate."""
        return {old: new for new, old in enumerate(self.origins, 1) if old is not None}

    @cached_property
    def _positions(self) -> list[int]:
        return list(self.mapping)

    def map_range(self, start: int, end: int) -> tuple[int, int] | None:
        """Shift a metadata range to its first and last retained cell."""
        mapping = self.mapping
        positions = self._positions
        lower = bisect_left(positions, start)
        upper = bisect_right(positions, end) - 1
        tail_delta = len(self.origins) - self.old_length
        if lower <= upper:
            last = mapping[positions[upper]] if end <= self.old_length else end + tail_delta
            return mapping[positions[lower]], last
        if end > self.old_length:
            return max(start, self.old_length + 1) + tail_delta, end + tail_delta
        return None

    def apply(self, delete: Callable[[int, int], None], insert: Callable[[int, int], None]) -> None:
        """Apply contiguous deletes in reverse and then contiguous inserts."""
        kept = self.mapping
        removed = (index for index in range(1, self.old_length + 1) if index not in kept)
        for start, size in reversed(list(_runs(removed))):
            delete(start, size)
        added = (i for i, old in enumerate(self.origins, 1) if old is None)
        for start, size in _runs(added):
            insert(start, size)


def _runs(positions):
    for _, group in groupby(enumerate(positions), key=lambda pair: pair[1] - pair[0]):
        indexes = [position for _, position in group]
        yield indexes[0], len(indexes)


def infer_origins(old: list, new: list, start: int) -> list[int | None]:
    """Align a resized manual snapshot with unchanged neighboring cells."""
    if len(old) == len(new):
        return list(range(start, start + len(old)))
    matcher = SequenceMatcher(a=old, b=new, autojunk=True)
    origins = []
    for _, old_start, old_end, new_start, new_end in matcher.get_opcodes():
        paired = min(old_end - old_start, new_end - new_start)
        origins.extend(range(start + old_start, start + old_start + paired))
        origins.extend([None] * (new_end - new_start - paired))
    return origins


def _shift_range(cell_range: CellRange, rows: AxisEdit, cols: AxisEdit) -> str | None:
    row_range = rows.map_range(cell_range.min_row, cell_range.max_row)
    col_range = cols.map_range(cell_range.min_col, cell_range.max_col)
    if row_range and col_range:
        return str(
            CellRange(
                min_col=col_range[0],
                min_row=row_range[0],
                max_col=col_range[1],
                max_row=row_range[1],
            )
        )
    return None


def reshape(ws: Worksheet, rows: AxisEdit, cols: AxisEdit) -> None:
    """Apply structural edits and relocate metadata OpenPyXL doesn't shift."""
    if rows.origins == list(range(1, rows.old_length + 1)) and cols.origins == list(
        range(1, cols.old_length + 1)
    ):
        return
    merged = list(ws.merged_cells.ranges)
    rules = [
        (item.sqref.ranges, ws.conditional_formatting[item]) for item in ws.conditional_formatting
    ]
    row_dimensions = list(ws.row_dimensions.items())
    column_dimensions = list(ws.column_dimensions.items())

    for cell_range in merged:
        ws.unmerge_cells(str(cell_range))
    rows.apply(ws.delete_rows, ws.insert_rows)
    cols.apply(ws.delete_cols, ws.insert_cols)
    for cell_range in merged:
        shifted = _shift_range(cell_range, rows, cols)
        if shifted and ":" in shifted:
            ws.merge_cells(shifted)

    ws.conditional_formatting = ConditionalFormattingList()
    for ranges, formatting in rules:
        shifted = [value for item in ranges if (value := _shift_range(item, rows, cols))]
        if shifted:
            for rule in formatting:
                ws.conditional_formatting.add(" ".join(sorted(shifted)), rule)

    ws.row_dimensions.clear()
    for position, dimension in row_dimensions:
        shifted = rows.map_range(position, position)
        if shifted:
            original = copy(dimension)
            original.index = shifted[0]
            ws.row_dimensions[original.index] = original

    ws.column_dimensions.clear()
    for key, dimension in column_dimensions:
        start = dimension.min or column_index_from_string(key)
        shifted = cols.map_range(start, dimension.max or start)
        if shifted:
            original = copy(dimension)
            original.min, original.max = shifted
            original.index = get_column_letter(original.min)
            ws.column_dimensions[original.index] = original


def comparable(value: Any) -> Any:
    """Normalize stored date/time values to the representation returned to the browser."""
    if isinstance(value, (date, datetime, time)):
        return value.isoformat()
    return value


def update_cell(ws: Worksheet, row: int, column: int, value: Any) -> None:
    """Write a changed value while retaining formatting, formulas, and blank merge cells."""
    cell = ws.cell(row, column)
    if comparable(cell.value) == value and (cell.data_type == "f") == isinstance(value, Formula):
        return
    if isinstance(cell, MergedCell):
        if value is not None:
            raise ValueError(f"Cannot set a value inside merged cell {cell.coordinate}")
        return
    cell.value = value
    if isinstance(value, str) and not isinstance(value, Formula):
        cell.data_type = "s"
