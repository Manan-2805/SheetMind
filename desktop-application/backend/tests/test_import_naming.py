"""Verify workbook import names and sheet-level failure reporting."""

import os
from datetime import UTC, datetime
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

from openpyxl import Workbook

from services.background_tasks import process_excel_file_sync
from services.duckdb_service import close_connection, get_connection
from services.excel_import_service import import_df_to_duckdb


class ImportNamingTests(TestCase):
    """Import synthetic files with colliding sheet and column names."""

    def setUp(self):
        self.root = Path(self.enterContext(TemporaryDirectory()))
        self.enterContext(patch.dict(os.environ, SHEETMIND_DATA_DIR=str(self.root)))
        self.addCleanup(close_connection, "default")
        self.path = self.root / "sample.xlsx"
        workbook = Workbook()
        workbook.active.title = "Sheet 1"
        workbook.active.append(["a", "a", None, "a-1"])
        workbook.active.append([1, 2, 3, 4])
        other = workbook.create_sheet("Sheet_1")
        other.append(["x"])
        other.append([9])
        workbook.save(self.path)
        self.conn = get_connection()

    def import_file(self, path):
        """Create pending upload metadata and invoke the normal import worker."""
        self.conn.execute(
            "INSERT INTO excel_files (id, original_filename, stored_path, uploaded_at, status) "
            "VALUES ('sample', ?, ?, ?, 'pending')",
            [path.name, str(path), datetime.now(UTC)],
        )
        process_excel_file_sync("default", "sample", str(path))

    def test_colliding_sheet_names_get_distinct_tables(self):
        """Keep both sheets when their normalized names collide."""
        self.import_file(self.path)
        names = self.conn.execute(
            "SELECT table_name FROM excel_sheets ORDER BY sheet_name"
        ).fetchall()
        self.assertEqual(names, [("file_sample_sheet_1",), ("file_sample_sheet_1_2",)])
        self.assertEqual(self.conn.execute("SELECT x FROM file_sample_sheet_1_2").fetchone(), (9,))

    def test_raw_workbook_headers_match_real_schema(self):
        """Normalize duplicate, blank, and punctuated Excel headers."""
        self.import_file(self.path)
        actual = self.conn.execute("DESCRIBE file_sample_sheet_1").fetchall()
        self.assertEqual([row[0] for row in actual], ["a", "a_1", "col_3", "a_1_1"])

    def test_raw_csv_headers_match_real_schema(self):
        """Apply the same rules before pandas can mangle CSV headers."""
        sample = self.root / "headers.csv"
        sample.write_text("a,a,,a-1\n1,2,3,4\n", encoding="utf-8")
        self.import_file(sample)
        actual = self.conn.execute("DESCRIBE file_sample").fetchall()
        self.assertEqual([row[0] for row in actual], ["a", "a_1", "col_3", "a_1_1"])

    def test_failing_sheet_names_the_sheet_and_rolls_back(self):
        """Mark the workbook as failed and roll back a preceding sheet."""

        def fail_second(conn, df, table_name):
            if list(df.columns) == ["x"]:
                raise ValueError("synthetic sheet error")
            return import_df_to_duckdb(conn, df, table_name)

        with patch("services.background_tasks.import_df_to_duckdb", side_effect=fail_second):
            self.import_file(self.path)
        status, error = self.conn.execute(
            "SELECT status, error_message FROM excel_files"
        ).fetchone()
        self.assertEqual(status, "error")
        self.assertIn("Sheet_1", error)
        self.assertEqual(self.conn.execute("SELECT count(*) FROM excel_sheets").fetchone(), (0,))
