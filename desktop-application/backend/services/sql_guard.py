"""Validate, bound, and interrupt SQL originating outside application code."""

import asyncio
import json
import math
from concurrent.futures import Future, ThreadPoolExecutor
from decimal import Decimal
from typing import Any

import duckdb

from schemas.chat_schemas import ResultColumn, ResultTable

QUERY_TIMEOUT_SECONDS = 30
_QUERY_WORKERS = ThreadPoolExecutor(max_workers=4, thread_name_prefix="sheetmind-sql")
_PURE_TABLE_FUNCTIONS = {"generate_series", "range", "unnest"}


class QueryTimeoutError(ValueError):
    """An analytical query exceeded its execution budget."""


def _check_functions(ast: Any) -> None:
    pending = [ast]
    while pending:
        value = pending.pop()
        if isinstance(value, list):
            pending.extend(value)
        elif isinstance(value, dict):
            if value.get("type") == "TABLE_FUNCTION":
                function = value.get("function", {})
                if function.get("function_name", "").lower() not in _PURE_TABLE_FUNCTIONS:
                    raise ValueError(
                        "SELECT queries may only use imported data and built-in generators"
                    )
                if function.get("schema") or function.get("catalog"):
                    raise ValueError("SELECT table functions must be unqualified")
            if value.get("function_name", "").lower() in {"query", "query_table", "nextval"}:
                raise ValueError("SELECT queries cannot invoke SQL or change database state")
            pending.extend(value.values())


def _validated_sql(conn: duckdb.DuckDBPyConnection, sql: str) -> str:
    statements = conn.extract_statements(sql)
    if len(statements) != 1 or statements[0].type != duckdb.StatementType.SELECT:
        raise ValueError("Exactly one SELECT statement is required")

    serialized = conn.execute("SELECT json_serialize_sql(?)", [sql]).fetchone()[0]
    ast = json.loads(serialized)
    if ast["error"]:
        raise ValueError("Could not validate this SELECT syntax")
    _check_functions(ast)

    catalog = conn.execute("SELECT current_database()").fetchone()[0].lower()
    imported_names = set()
    for (name,) in conn.execute(
        "SELECT table_name FROM excel_sheets WHERE starts_with(lower(table_name), 'file_')"
    ).fetchall():
        lower_name = name.lower()
        imported_names.update({lower_name, f"main.{lower_name}", f"{catalog}.main.{lower_name}"})
    referenced = {name.lower() for name in conn.get_table_names(sql, qualified=True)}
    if not referenced.issubset(imported_names):
        raise ValueError(
            "SELECT queries may only reference imported data tables. "
            "Use the exact DuckDB table name (file_...) from the schema."
        )

    return conn.execute("SELECT json_deserialize_sql(?)", [serialized]).fetchone()[0]


def _result_value(value: Any) -> Any:
    if isinstance(value, Decimal):
        value = float(value)
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, list):
        return [_result_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _result_value(item) for key, item in value.items()}
    return value


def _read_page(conn: duckdb.DuckDBPyConnection, sql: str, page: int, size: int) -> ResultTable:
    with conn:
        conn.execute("BEGIN TRANSACTION")
        query = _validated_sql(conn, sql)
        wrapped = f"FROM ({query}) AS sheetmind_results"
        total_rows = conn.execute(f"SELECT count(*) {wrapped}").fetchone()[0]
        total_pages = max(1, (total_rows + size - 1) // size)
        page = max(1, min(page, total_pages))
        result = conn.execute(f"SELECT * {wrapped} LIMIT ? OFFSET ?", [size, (page - 1) * size])
        keys = [column[0] for column in result.description]
        rows = [
            {key: _result_value(value) for key, value in zip(keys, row, strict=True)}
            for row in result.fetchall()
        ]
        conn.execute("COMMIT")
        return ResultTable(
            columns=[ResultColumn(key=key, label=key) for key in keys],
            rows=rows,
            total_rows=total_rows,
            page=page,
            page_size=size,
            total_pages=total_pages,
        )


def _start_query(
    conn: duckdb.DuckDBPyConnection,
    sql: str,
    row_limit: int,
    page: int = 1,
    page_size: int | None = None,
) -> tuple[Future[ResultTable], duckdb.DuckDBPyConnection]:
    size = max(1, min(row_limit, page_size if page_size is not None else row_limit))
    cursor = conn.cursor()
    return _QUERY_WORKERS.submit(_read_page, cursor, sql, page, size), cursor


def _interrupt(future: Future[ResultTable], cursor: duckdb.DuckDBPyConnection) -> None:
    if future.cancel():
        cursor.close()
    elif not future.done():
        cursor.interrupt()


def run_user_query(
    conn: duckdb.DuckDBPyConnection,
    sql: str,
    row_limit: int,
    page: int = 1,
    page_size: int | None = None,
) -> ResultTable:
    """Run one validated SELECT and return a counted page capped by user settings."""
    future, cursor = _start_query(conn, sql, row_limit, page, page_size)
    try:
        return future.result(timeout=QUERY_TIMEOUT_SECONDS)
    except TimeoutError as exc:
        _interrupt(future, cursor)
        raise QueryTimeoutError(f"Query timed out after {QUERY_TIMEOUT_SECONDS} seconds") from exc
    except duckdb.Error as exc:
        raise ValueError(f"SQL execution failed: {exc}") from exc


async def run_chat_query(conn: duckdb.DuckDBPyConnection, sql: str, row_limit: int) -> ResultTable:
    """Run the same guard with cancellation tied to the active chat request."""
    future, cursor = _start_query(conn, sql, row_limit)
    wrapped = asyncio.wrap_future(future)
    try:
        done, _ = await asyncio.wait((wrapped,), timeout=QUERY_TIMEOUT_SECONDS)
        if done:
            return wrapped.result()
        raise QueryTimeoutError(f"Query timed out after {QUERY_TIMEOUT_SECONDS} seconds")
    except (asyncio.CancelledError, QueryTimeoutError):
        wrapped.cancel()
        _interrupt(future, cursor)
        raise
    except duckdb.Error as exc:
        raise ValueError(f"SQL execution failed: {exc}") from exc
