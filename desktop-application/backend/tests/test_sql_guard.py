"""Verify that analytical SQL stays within imported data and a row budget."""

from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

import duckdb
import pandas as pd

from services.excel_import_service import import_df_to_duckdb
from services.sql_guard import run_user_query


class SqlGuardTests(TestCase):
    """Run the guard against real DuckDB with synthetic data."""

    def setUp(self):
        self.conn = self.enterContext(duckdb.connect(config={"enable_external_access": "false"}))
        self.conn.execute("SET lock_configuration = true")
        self.conn.execute("CREATE TABLE settings AS SELECT 1 AS private_setting")
        self.conn.execute("CREATE TABLE excel_sheets AS SELECT 'file_fixture' AS table_name")
        import_df_to_duckdb(self.conn, pd.DataFrame({"v": [1, 2, 3]}), "file_fixture")

    def test_import_with_external_access_disabled(self):
        """Import a pandas frame even when filesystem access is locked."""
        self.assertEqual(self.conn.execute("SELECT count(*) FROM file_fixture").fetchone(), (3,))
        with self.assertRaises(duckdb.Error):
            self.conn.execute("SET enable_external_access = true")

    def test_select_with_cte_and_paging(self):
        """Read imported rows with deterministic ordering and bounded paging."""
        sql = "WITH data AS (SELECT v FROM file_fixture) SELECT v FROM data ORDER BY v; -- end"
        result = run_user_query(self.conn, sql, row_limit=2, page=99, page_size=10)
        self.assertEqual(result.rows, [{"v": 3}])
        self.assertEqual((result.total_rows, result.page, result.total_pages), (3, 2, 2))
        self.assertEqual(run_user_query(self.conn, "SELECT 1 AS v", 1).rows, [{"v": 1}])

    def test_join_using_imported_columns(self):
        """The table-name lookup must handle valid joins on a shared column."""
        self.conn.execute("CREATE TABLE file_quantities AS SELECT 2 AS v, 9 AS quantity")
        self.conn.execute("INSERT INTO excel_sheets VALUES ('file_quantities')")
        for join in ("USING (v)", "ON f.v = q.v"):
            with self.subTest(join=join):
                result = run_user_query(
                    self.conn,
                    "SELECT SUM(q.quantity) AS total FROM file_fixture f "
                    f"JOIN file_quantities q {join}",
                    5,
                )
                self.assertEqual(result.rows, [{"total": 9}])

    def test_join_using_cannot_reference_app_tables(self):
        """Removing the lookup-only join condition must not hide a table."""
        with self.assertRaisesRegex(ValueError, "only reference imported data tables"):
            run_user_query(
                self.conn,
                "SELECT * FROM file_fixture f JOIN settings AS q USING (v)",
                5,
            )

    def test_reject_nonselect_and_multiple_statements(self):
        """Reject catalog changes and batches before execution."""
        with TemporaryDirectory() as temporary:
            for sql in (
                "DROP TABLE file_fixture",
                "DELETE FROM file_fixture",
                "INSERT INTO file_fixture VALUES (4)",
                f"COPY file_fixture TO '{temporary}/output.csv'",
                f"ATTACH '{temporary}/other.duckdb'",
                "PRAGMA version",
                "SELECT 1; DROP TABLE file_fixture",
            ):
                with self.subTest(sql=sql), self.assertRaisesRegex(ValueError, "SELECT"):
                    run_user_query(self.conn, sql, 2)

    def test_reject_private_tables_and_external_scans(self):
        """Reject direct and nested accesses outside the imported dataset."""
        for sql in (
            "SELECT * FROM settings",
            "SELECT (SELECT private_setting FROM main.settings)",
            "WITH nested AS (SELECT * FROM settings) SELECT * FROM nested",
            "SELECT * FROM read_csv('/etc/hosts')",
            "SELECT * FROM read_text('/etc/hosts')",
        ):
            with self.subTest(sql=sql), self.assertRaises(ValueError):
                run_user_query(self.conn, sql, 2)

    def test_timeout_leaves_application_connection_usable(self):
        """Interrupt the query worker without closing the application's connection."""
        with (
            patch("services.sql_guard.QUERY_TIMEOUT_SECONDS", 0.05),
            self.assertRaisesRegex(ValueError, "Query timed out"),
        ):
            run_user_query(
                self.conn,
                "SELECT v FROM range(10000000000) AS data(v) WHERE hash(v) % 173 = 0",
                2,
            )
        self.assertEqual(self.conn.execute("SELECT 1").fetchone(), (1,))
