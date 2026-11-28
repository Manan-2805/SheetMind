"""Exercise workbook saves and restores against disposable storage."""

import os
from datetime import UTC, datetime
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

from openpyxl import Workbook, load_workbook
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Font

from schemas.excel_editor_schemas import SheetData
from schemas.excel_operations import ConstantValue, SetValue
from services.duckdb_service import close_connection, get_connection
from services.excel_editor_service import (
    apply_mutation_to_disk,
    get_available_files,
    get_edit_history,
    get_workbook_download,
    open_excel_file,
    restore_backup,
    save_manual_edits,
)
from services.storage_service import get_backups_dir


class ExcelDiskTests(TestCase):
    """Build a styled workbook with charts-free, synthetic sheet values."""

    def setUp(self):
        temp = self.enterContext(TemporaryDirectory())
        self.enterContext(patch.dict(os.environ, SHEETMIND_DATA_DIR=temp))
        self.addCleanup(close_connection, "default")
        self.path = Path(temp) / "styled.xlsx"
        workbook = Workbook()
        sheet = workbook.active
        sheet.append(["label", "amount", "notes"])
        sheet.append(["keep", 2, "merged"])
        sheet.append(["next", 3])
        sheet["A3"].font = Font(bold=True)
        sheet["B3"] = "=B2+1"
        sheet.merge_cells("C2:C3")
        sheet.column_dimensions["B"].width = 27
        sheet.conditional_formatting.add("B2:B3", CellIsRule(operator="greaterThan", formula=["1"]))
        workbook.save(self.path)
        self.conn = get_connection()
        self.register_file("synthetic", self.path)

    def register_file(self, file_id, path):
        """Add minimal file metadata."""
        self.conn.execute(
            "INSERT INTO excel_files (id, original_filename, stored_path, uploaded_at) "
            "VALUES (?, ?, ?, ?)",
            [file_id, path.name, str(path), datetime.now(UTC)],
        )

    def test_apply_reads_disk_and_keeps_workbook_features(self):
        """Ignore client cell values when applying operations."""
        operation = SetValue(type="value_fill", column="amount", value=ConstantValue(const=3))
        apply_mutation_to_disk(
            "synthetic",
            "Sheet",
            [operation],
            [["forged", None, None], ["forged", None, None]],
            ["label", "amount", "notes"],
        )
        sheet = load_workbook(self.path).active
        self.assertEqual(sheet["A2"].value, "keep")
        self.assertEqual(sheet["B2"].value, 2)
        self.assertEqual(sheet["B3"].value, "=B2+1")
        self.assertTrue(sheet["A3"].font.bold)
        self.assertEqual(sheet.column_dimensions["B"].width, 27)
        self.assertIn("C2:C3", sheet.merged_cells)
        self.assertEqual(len(sheet.conditional_formatting), 1)

    def test_reject_unsaved_workbook_shape(self):
        """Reject a client snapshot whose sheet dimensions are stale."""
        with self.assertRaisesRegex(ValueError, "Save your manual edits first") as error:
            apply_mutation_to_disk("synthetic", "Sheet", [], [], ["label", "amount", "notes"])
        self.assertEqual(error.exception.status_code, 409)

    def test_manual_save_updates_only_changed_cells(self):
        """Retain original formatting and only replace changed cell values."""
        data = SheetData(
            sheetName="Sheet",
            columns=["label", "amount", "notes"],
            rows=[["changed", 2, "merged"], ["next", "=B2+1", None]],
            rowCount=2,
            colCount=3,
        )
        save_manual_edits("synthetic", [data], {})
        sheet = load_workbook(self.path).active
        self.assertEqual(sheet["A2"].value, "changed")
        self.assertEqual(sheet["B2"].value, 2)
        self.assertTrue(sheet["A3"].font.bold)
        self.assertIn("C2:C3", sheet.merged_cells)
        self.assertEqual(len(sheet.conditional_formatting), 1)

    def test_download_contains_saved_edits(self):
        """Downloads return the edited workbook while keeping its original filename."""
        data = SheetData(
            sheetName="Sheet",
            columns=["label", "amount", "notes"],
            rows=[["saved", 9, "merged"], ["next", "=B2+1", None]],
            rowCount=2,
            colCount=3,
        )
        save_manual_edits("synthetic", [data], {})
        filename, path = get_workbook_download("synthetic")
        self.assertEqual(filename, "styled.xlsx")
        self.assertEqual(load_workbook(path).active["B2"].value, 9)

    def test_backup_retention_and_restore_through_history(self):
        """Keep distinct snapshots and restore a selected revision by its ID."""
        operation = SetValue(type="value_update", column="label", value=ConstantValue(const="new"))
        rows = [["keep", 2, "merged"], ["next", "=B2+1", None]]
        for _ in range(22):
            apply_mutation_to_disk(
                "synthetic", "Sheet", [operation], rows, ["label", "amount", "notes"]
            )
        backups = list(get_backups_dir().glob("*.xlsx"))
        self.assertEqual(len(backups), 20)
        self.assertEqual(len({path.name for path in backups}), 20)
        history = get_edit_history("synthetic")
        restore_backup("synthetic", history[0].id)
        with self.assertRaisesRegex(ValueError, "Backup file not found") as error:
            restore_backup("synthetic", history[-1].id)
        self.assertEqual(error.exception.status_code, 404)

    def test_restore_rejects_backup_outside_directory(self):
        """Refuse even a stored history record whose path leaves the backup root."""
        self.conn.execute(
            "INSERT INTO edit_history VALUES ('external', 'synthetic', 'Sheet', 'test', 0, ?, ?, true)",
            [datetime.now(UTC), str(self.path)],
        )
        with self.assertRaisesRegex(ValueError, "outside") as error:
            restore_backup("synthetic", "external")
        self.assertEqual(error.exception.status_code, 400)

    def test_only_xlsx_is_editable(self):
        """List CSV and legacy spreadsheets as read-only."""
        for suffix in (".csv", ".xls", ".ods"):
            self.register_file(suffix, self.path.with_suffix(suffix))
            with self.assertRaisesRegex(ValueError, "Only .xlsx") as error:
                open_excel_file(suffix)
            self.assertEqual(error.exception.status_code, 400)
        editable = {item.fileId: item.editable for item in get_available_files()}
        self.assertEqual(editable, {"synthetic": True, ".csv": False, ".xls": False, ".ods": False})

    def test_failed_atomic_write_preserves_original(self):
        """Leave the live workbook and no partial file after a replace error."""
        original = self.path.read_bytes()
        operation = SetValue(type="value_update", column="label", value=ConstantValue(const="new"))
        with (
            patch("services.excel_editor_service.os.replace", side_effect=OSError("test failure")),
            self.assertRaisesRegex(OSError, "test failure"),
        ):
            apply_mutation_to_disk(
                "synthetic",
                "Sheet",
                [operation],
                [[None] * 3] * 2,
                ["label", "amount", "notes"],
            )
        self.assertEqual(self.path.read_bytes(), original)
        self.assertEqual(list(self.path.parent.glob("*.xlsx")), [self.path])
