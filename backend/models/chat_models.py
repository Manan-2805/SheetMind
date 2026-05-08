from datetime import datetime, timedelta, timezone
import json
import re
import time
from typing import Any

import httpx
from openai import AsyncOpenAI
import pandas as pd

import models.artifact_models as artifact_models
from models.settings_models import get_settings
from schemas.chat_schemas import (
    ChatMessageResponse,
    ChatSessionResponse,
    ResultColumn,
    ResultTable,
)
from services.query_service import dataframe_to_result_table
from services.storage_service import get_debug_prompts_dir, get_exports_dir


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _ago(days: int = 0, hours: int = 0, minutes: int = 0) -> datetime:
    return _now() - timedelta(days=days, hours=hours, minutes=minutes)


MOCK_SESSIONS: list[dict[str, Any]] = [
    {
        "id": "sess-001",
        "title": "Q1 Revenue Breakdown",
        "created_at": _ago(days=0, hours=1),
        "updated_at": _ago(days=0, minutes=30),
        "is_favorite": True,
        "message_count": 6,
    },
    {
        "id": "sess-002",
        "title": "Marketing Spend by Channel",
        "created_at": _ago(days=0, hours=4),
        "updated_at": _ago(days=0, hours=3),
        "is_favorite": False,
        "message_count": 3,
    },
    {
        "id": "sess-003",
        "title": "Top 10 Customers by GMV",
        "created_at": _ago(days=1, hours=2),
        "updated_at": _ago(days=1, hours=1),
        "is_favorite": False,
        "message_count": 4,
    },
    {
        "id": "sess-004",
        "title": "Inventory Turnover Analysis",
        "created_at": _ago(days=3),
        "updated_at": _ago(days=3),
        "is_favorite": True,
        "message_count": 8,
    },
    {
        "id": "sess-005",
        "title": "Employee Headcount by Department",
        "created_at": _ago(days=8),
        "updated_at": _ago(days=8),
        "is_favorite": False,
        "message_count": 2,
    },
]

MOCK_RESULT_TABLE = ResultTable(
    columns=[
        ResultColumn(key="customer_name", label="Customer Name"),
        ResultColumn(key="region", label="Region"),
        ResultColumn(key="total_revenue", label="Total Revenue"),
        ResultColumn(key="orders_count", label="Orders"),
        ResultColumn(key="avg_order_value", label="Avg Order Value"),
    ],
    rows=[
        {"customer_name": "Acme Corp", "region": "North America", "total_revenue": 482930.50, "orders_count": 142, "avg_order_value": 3401.62},
        {"customer_name": "GlobalTech Ltd", "region": "Europe", "total_revenue": 371200.00, "orders_count": 98, "avg_order_value": 3787.76},
        {"customer_name": "Pacific Ventures", "region": "Asia Pacific", "total_revenue": 298450.75, "orders_count": 87, "avg_order_value": 3430.47},
        {"customer_name": "Sunrise Industries", "region": "North America", "total_revenue": 241800.20, "orders_count": 76, "avg_order_value": 3181.58},
        {"customer_name": "Delta Systems", "region": "Europe", "total_revenue": 198340.90, "orders_count": 65, "avg_order_value": 3051.40},
        {"customer_name": "Orion Group", "region": "Latin America", "total_revenue": 176520.00, "orders_count": 54, "avg_order_value": 3269.00},
        {"customer_name": "Meridian Co", "region": "Middle East", "total_revenue": 154300.45, "orders_count": 48, "avg_order_value": 3214.59},
        {"customer_name": "Nexus Partners", "region": "North America", "total_revenue": 132780.30, "orders_count": 41, "avg_order_value": 3238.54},
    ],
    total_rows=47,
)

MOCK_MESSAGES: list[dict[str, Any]] = [
    {
        "id": "msg-001",
        "session_id": "sess-001",
        "role": "user",
        "content": "Show me the top 10 customers by total revenue for Q1 2024",
        "created_at": _ago(hours=1, minutes=5),
        "sql_generated": None,
        "sql_execution_ms": None,
        "llm_generation_ms": None,
        "token_count_input": None,
        "token_count_output": None,
        "confidence_score": None,
        "result_row_count": None,
        "result_data": None,
        "nl_summary": None,
        "referenced_files": ["Q1_2024_Sales.xlsx"],
    },
    {
        "id": "msg-002",
        "session_id": "sess-001",
        "role": "assistant",
        "content": "Here are the top customers by total revenue for Q1 2024, pulled from the **Sales** sheet.",
        "created_at": _ago(hours=1, minutes=4),
        "sql_generated": "SELECT customer_name, region, SUM(revenue) AS total_revenue,\n  COUNT(order_id) AS orders_count,\n  AVG(revenue) AS avg_order_value\nFROM \"Q1_2024_Sales.xlsx\".\"Sales\"\nWHERE order_date BETWEEN '2024-01-01' AND '2024-03-31'\nGROUP BY customer_name, region\nORDER BY total_revenue DESC\nLIMIT 10;",
        "sql_execution_ms": 38,
        "llm_generation_ms": 742,
        "token_count_input": 284,
        "token_count_output": 97,
        "confidence_score": 5,
        "result_row_count": 47,
        "result_data": MOCK_RESULT_TABLE,
        "nl_summary": "Acme Corp leads with $482K across 142 orders, followed by GlobalTech at $371K. North America dominates with 3 of the top 5 customers.",
        "referenced_files": ["Q1_2024_Sales.xlsx"],
    },
    {
        "id": "msg-003",
        "session_id": "sess-001",
        "role": "assistant",
        "content": "Would you like me to break this down further by product category or show monthly trends for these customers?",
        "created_at": _ago(hours=1, minutes=3),
        "sql_generated": None,
        "sql_execution_ms": None,
        "llm_generation_ms": 310,
        "token_count_input": 198,
        "token_count_output": 42,
        "confidence_score": 4,
        "result_row_count": None,
        "result_data": None,
        "nl_summary": None,
        "referenced_files": [],
    },
]


from services.duckdb_service import get_connection

def get_sessions() -> list[ChatSessionResponse]:
    conn = get_connection()
    result = conn.execute("""
        SELECT s.id, s.title, s.created_at, s.updated_at, s.is_favorite, COUNT(m.id) as message_count
        FROM chat_sessions s
        LEFT JOIN chat_messages m ON s.id = m.session_id
        GROUP BY s.id, s.title, s.created_at, s.updated_at, s.is_favorite
        ORDER BY s.updated_at DESC
    """).fetchall()
    
    sessions = []
    for row in result:
        sessions.append(ChatSessionResponse(
            id=row[0],
            title=row[1],
            created_at=row[2],
            updated_at=row[3],
            is_favorite=row[4],
            message_count=row[5]
        ))
    return sessions


def get_messages(session_id: str) -> list[ChatMessageResponse]:
    conn = get_connection()
    result = conn.execute("""
        SELECT id, session_id, role, content, created_at, sql_generated, 
               sql_execution_ms, llm_generation_ms, token_count_input, 
               token_count_output, confidence_score, result_row_count
        FROM chat_messages
        WHERE session_id = ?
        ORDER BY created_at ASC
    """, [session_id]).fetchall()
    
    messages = []
    for row in result:
        # We don't store result_data in DB currently to save space, but we could serialize it as JSON
        # For this version we will return what we have
        messages.append(ChatMessageResponse(
            id=row[0],
            session_id=row[1],
            role=row[2],
            content=row[3],
            created_at=row[4],
            sql_generated=row[5],
            sql_execution_ms=row[6],
            llm_generation_ms=row[7],
            token_count_input=row[8],
            token_count_output=row[9],
            confidence_score=row[10],
            result_row_count=row[11]
        ))
    return messages


def create_session(title: str | None = None) -> ChatSessionResponse:
    import uuid
    now = _now()
    session_id = f"sess-{uuid.uuid4().hex[:8]}"
    title = title or "New conversation"
    conn = get_connection()
    conn.execute(
        "INSERT INTO chat_sessions (id, title, created_at, updated_at, is_favorite) VALUES (?, ?, ?, ?, ?)",
        [session_id, title, now, now, False]
    )
    return ChatSessionResponse(
        id=session_id,
        title=title,
        created_at=now,
        updated_at=now,
        is_favorite=False,
        message_count=0,
    )


def update_session(session_id: str, title: str | None = None, is_favorite: bool | None = None) -> ChatSessionResponse:
    conn = get_connection()
    if title is not None:
        conn.execute("UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?", [title, _now(), session_id])
    if is_favorite is not None:
        conn.execute("UPDATE chat_sessions SET is_favorite = ?, updated_at = ? WHERE id = ?", [is_favorite, _now(), session_id])
    
    # fetch updated session
    row = conn.execute("SELECT id, title, created_at, updated_at, is_favorite FROM chat_sessions WHERE id = ?", [session_id]).fetchone()
    if row:
        return ChatSessionResponse(
            id=row[0], title=row[1], created_at=row[2], updated_at=row[3], is_favorite=row[4], message_count=0
        )
    raise ValueError("Session not found")

def delete_session(session_id: str):
    conn = get_connection()
    conn.execute("DELETE FROM chat_messages WHERE session_id = ?", [session_id])
    conn.execute("DELETE FROM chat_sessions WHERE id = ?", [session_id])


def set_message_feedback(message_id: str, feedback: str) -> None:
    conn = get_connection()
    conn.execute(
        "UPDATE chat_messages SET feedback = ? WHERE id = ?",
        [feedback, message_id]
    )

def _extract_json_sql(raw: str) -> tuple[str, str]:
    """Parse JSON response {sql, message} from LLM. Returns (sql, message)."""
    text = raw.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    try:
        data = json.loads(text)
        return str(data.get("sql", "")).strip(), str(data.get("message") or "")
    except json.JSONDecodeError:
        pass
    # Fallback: extract first SELECT/WITH/INSERT block
    import re
    match = re.search(r"((?:SELECT|WITH|INSERT|UPDATE|DELETE)[\s\S]+?)(?:```|$)", text, re.IGNORECASE)
    if match:
        return match.group(1).strip(), ""
    return text, ""


def _write_debug_prompt(prompt: str) -> None:
    debug_dir = get_debug_prompts_dir()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    debug_path = debug_dir / f"prompt_{timestamp}.txt"
    debug_path.write_text(prompt, encoding="utf-8")


def _split_reference(value: str) -> tuple[str, str | None]:
    if "::" in value:
        filename, sheet_name = value.split("::", 1)
        return filename.strip(), sheet_name.strip() or None
    if ":" in value:
        filename, sheet_name = value.split(":", 1)
        return filename.strip(), sheet_name.strip() or None
    return value.strip(), None


def _extract_references_from_content(conn, content: str) -> list[str]:
    if not content:
        return []

    file_rows = conn.execute(
        "SELECT id, original_filename FROM excel_files WHERE status = 'completed'"
    ).fetchall()
    if not file_rows:
        return []

    sheets_rows = conn.execute(
        "SELECT excel_file_id, sheet_name FROM excel_sheets"
    ).fetchall()
    sheets_by_file: dict[str, list[str]] = {}
    for file_id, sheet_name in sheets_rows:
        sheets_by_file.setdefault(str(file_id), []).append(str(sheet_name))

    refs: list[str] = []
    seen = set()
    for file_id, filename in file_rows:
        file_id = str(file_id)
        filename = str(filename)
        matched_sheet = False
        for sheet_name in sheets_by_file.get(file_id, []):
            if f"#{filename}::{sheet_name}" in content or f"#{filename}:{sheet_name}" in content:
                ref = f"{filename}::{sheet_name}"
                if ref not in seen:
                    refs.append(ref)
                    seen.add(ref)
                matched_sheet = True
        if not matched_sheet and f"#{filename}" in content:
            if filename not in seen:
                refs.append(filename)
                seen.add(filename)
    return refs


def _resolve_schema_tables(conn, referenced_files: list[str], content: str) -> tuple[list[dict[str, str]], list[str]]:
    effective_refs = [r for r in referenced_files if r.strip()]
    if not effective_refs:
        effective_refs = _extract_references_from_content(conn, content)

    tables: list[dict[str, str]] = []
    seen_tables: set[str] = set()

    if effective_refs:
        for ref in effective_refs:
            filename, sheet_name = _split_reference(ref)
            file_row = conn.execute(
                "SELECT id FROM excel_files WHERE original_filename = ? AND status = 'completed'",
                [filename],
            ).fetchone()
            if not file_row:
                continue
            file_id = str(file_row[0])
            if sheet_name:
                sheet_row = conn.execute(
                    """
                    SELECT sheet_name, table_name
                    FROM excel_sheets
                    WHERE excel_file_id = ? AND sheet_name = ?
                    """,
                    [file_id, sheet_name],
                ).fetchone()
                if sheet_row:
                    table_name = sheet_row[1]
                    if table_name not in seen_tables:
                        tables.append({
                            "filename": filename,
                            "sheet_name": sheet_row[0],
                            "table_name": table_name,
                        })
                        seen_tables.add(table_name)
            else:
                sheet_rows = conn.execute(
                    """
                    SELECT sheet_name, table_name
                    FROM excel_sheets
                    WHERE excel_file_id = ?
                    ORDER BY sheet_name ASC
                    """,
                    [file_id],
                ).fetchall()
                for sheet_row in sheet_rows:
                    table_name = sheet_row[1]
                    if table_name not in seen_tables:
                        tables.append({
                            "filename": filename,
                            "sheet_name": sheet_row[0],
                            "table_name": table_name,
                        })
                        seen_tables.add(table_name)

    if not tables:
        all_rows = conn.execute(
            """
            SELECT f.original_filename, s.sheet_name, s.table_name
            FROM excel_files f
            JOIN excel_sheets s ON s.excel_file_id = f.id
            WHERE f.status = 'completed'
            ORDER BY f.uploaded_at DESC, s.sheet_name ASC
            """
        ).fetchall()
        for filename, sheet_name, table_name in all_rows:
            if table_name not in seen_tables:
                tables.append({
                    "filename": str(filename),
                    "sheet_name": str(sheet_name),
                    "table_name": str(table_name),
                })
                seen_tables.add(str(table_name))

    return tables, effective_refs


def _build_schema_info(conn, tables: list[dict[str, str]]) -> str:
    schema_info = ""
    for entry in tables:
        filename = entry["filename"]
        sheet_name = entry["sheet_name"]
        table_name = entry["table_name"]
        try:
            cols = conn.execute(f"DESCRIBE {table_name}").fetchall()
            col_defs = ", ".join([f"{c[0]} ({c[1]})" for c in cols])
            schema_info += (
                f"File: {filename}\n"
                f"Sheet: {sheet_name}\n"
                f"DuckDB Table Name: {table_name}\n"
                f"Columns: {col_defs}\n\n"
            )
        except Exception:
            pass

    return schema_info or "No completed tables available yet."


def _get_result_row_limit() -> int:
    settings = get_settings()
    limit = settings.result_row_limit if hasattr(settings, "result_row_limit") else 500
    try:
        limit = int(limit)
    except Exception:
        limit = 500
    return max(1, limit)


def _get_message_sql(conn, message_id: str) -> tuple[str, str]:
    row = conn.execute(
        "SELECT sql_generated, session_id FROM chat_messages WHERE id = ?",
        [message_id],
    ).fetchone()
    if not row:
        raise ValueError("Message not found")
    sql, session_id = row
    sql = str(sql or "").strip()
    if not sql or sql.startswith("ERROR"):
        raise ValueError("Message has no valid SQL")
    return sql, str(session_id)


def get_message_data(message_id: str) -> ResultTable:
    conn = get_connection()
    sql, _session_id = _get_message_sql(conn, message_id)
    try:
        df = conn.execute(sql).fetchdf()
    except Exception as exc:
        raise ValueError(f"SQL Execution Failed: {str(exc)}")
    return dataframe_to_result_table(df, _get_result_row_limit())


def export_message(message_id: str):
    conn = get_connection()
    sql, session_id = _get_message_sql(conn, message_id)
    try:
        df = conn.execute(sql).fetchdf()
    except Exception as exc:
        raise ValueError(f"SQL Execution Failed: {str(exc)}")

    session_row = conn.execute(
        "SELECT title FROM chat_sessions WHERE id = ?",
        [session_id],
    ).fetchone()
    session_title = session_row[0] if session_row and session_row[0] else "Chat export"

    exports_dir = get_exports_dir()
    safe_title = re.sub(r"[^0-9A-Za-z_]+", "_", session_title).strip("_") or "chat_export"
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"{safe_title}_{timestamp}.xlsx"
    file_path = exports_dir / filename
    df.to_excel(file_path, index=False)
    file_size = file_path.stat().st_size

    return artifact_models.create_export(
        filename=filename,
        file_path=str(file_path),
        file_size_bytes=file_size,
        title=session_title,
        source_message_id=message_id,
    )


async def generate_sql(content: str, schema_info: str) -> tuple[str, str]:
    """Returns (sql, llm_message) where llm_message is optional context from the LLM."""
    prompt = f"""You are an expert DuckDB SQL generator.

The following DuckDB tables are available (use ONLY these exact table names in your SQL, never use file names or sheet names):

{schema_info}

CRITICAL RULES:
- Use ONLY the exact "DuckDB Table Name" values shown above (e.g. file_abc123_def456) in your FROM clause.
- Do NOT use file names, sheet names, or any other identifiers.
- Respond with ONLY a valid JSON object, no prose, no markdown fences.

Required JSON format:
{{"sql": "<the complete DuckDB SQL query>", "message": "<optional one-sentence note, or null>"}}

User question: "{content}"""""
    _write_debug_prompt(prompt)

    settings = get_settings()
    if settings.llm_provider == "openai":
        client = AsyncOpenAI(api_key=settings.openai.api_key)
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            response_format={"type": "json_object"},
        )
        return _extract_json_sql(response.choices[0].message.content or "")
    else:
        url = settings.ollama.url.rstrip("/")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{url}/api/generate",
                json={
                    "model": settings.ollama.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                },
                timeout=60.0
            )
            resp.raise_for_status()
            return _extract_json_sql(resp.json()["response"])

async def generate_nl_summary(content: str, sql: str, results: list) -> str:
    results_str = json.dumps(results[:100], default=str)
    prompt = f"""You are a helpful data analyst assistant. 
The user asked: "{content}"
I ran the following SQL query:
{sql}
And got these results (showing up to 100 rows):
{results_str}

Please provide a concise, natural language summary of these results to answer the user's question directly.
Do not mention the SQL query itself, just interpret the data."""

    settings = get_settings()
    if settings.llm_provider == "openai":
        client = AsyncOpenAI(api_key=settings.openai.api_key)
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        return response.choices[0].message.content.strip()
    else:
        url = settings.ollama.url.rstrip("/")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{url}/api/generate",
                json={
                    "model": settings.ollama.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=60.0
            )
            resp.raise_for_status()
            return resp.json()["response"].strip()


async def generate_title(content: str) -> str:
    prompt = f"""Generate a very short, concise title (max 5 words) for a chat conversation that starts with this message: "{content}". Do not use quotes or prefixes, just the title text."""
    settings = get_settings()
    if settings.llm_provider == "openai":
        client = AsyncOpenAI(api_key=settings.openai.api_key)
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    else:
        url = settings.ollama.url.rstrip("/")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{url}/api/generate",
                json={"model": settings.ollama.model, "prompt": prompt, "stream": False},
                timeout=30.0
            )
            resp.raise_for_status()
            return resp.json()["response"].strip()


async def generate_query_label(nl_query: str, sql_query: str) -> str:
    prompt = f"""Create a short, human-readable label (max 6 words) for a saved SQL query.
The user asked: "{nl_query}"
The SQL generated: {sql_query[:200]}
Return ONLY the label text, no quotes, no punctuation at end."""
    settings = get_settings()
    if settings.llm_provider == "openai":
        client = AsyncOpenAI(api_key=settings.openai.api_key)
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    else:
        url = settings.ollama.url.rstrip("/")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{url}/api/generate",
                json={"model": settings.ollama.model, "prompt": prompt, "stream": False},
                timeout=30.0
            )
            resp.raise_for_status()
            return resp.json()["response"].strip()


async def create_message(
    session_id: str,
    content: str,
    referenced_files: list[str],
) -> ChatMessageResponse:
    import uuid
    now = _now()
    conn = get_connection()
    user_msg_id = f"msg-{uuid.uuid4().hex[:8]}-u"
    conn.execute(
        "INSERT INTO chat_messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        [user_msg_id, session_id, "user", content, now]
    )
    
    # 1. Fetch Schema - use referenced files if provided, else parse from content / fallback to all
    tables, effective_refs = _resolve_schema_tables(conn, referenced_files, content)
    schema_info = _build_schema_info(conn, tables)

    # Check if first message AND session still has default title (guard against re-triggering)
    msg_count = conn.execute(
        "SELECT COUNT(*) FROM chat_messages WHERE session_id = ?", [session_id]
    ).fetchone()[0]
    sess_row = conn.execute(
        "SELECT title FROM chat_sessions WHERE id = ?", [session_id]
    ).fetchone()
    current_title = sess_row[0] if sess_row else ""
    is_first = msg_count == 1 and current_title in ("New conversation", "", None)

    # 2. Generate SQL and potentially Title
    t0 = time.time()
    session_title: str | None = None
    llm_message: str = ""
    try:
        if is_first:
            import asyncio
            (sql_result, llm_message), title = await asyncio.gather(
                generate_sql(content, schema_info),
                generate_title(content)
            )
            conn.execute("UPDATE chat_sessions SET title = ? WHERE id = ?", [title, session_id])
            session_title = title
        else:
            sql_result, llm_message = await generate_sql(content, schema_info)

        sql = sql_result.strip()
    except Exception as e:
        sql = f"ERROR: Failed to generate SQL: {str(e)}"
        llm_message = ""
    t1 = time.time()
    llm_ms = int((t1 - t0) * 1000)

    # 3. Execute SQL
    sql_ms = 0
    result_table = None
    result_rows = []
    # Use LLM message as fallback if SQL failed to generate
    nl_summary = llm_message if (sql.startswith("ERROR") and llm_message) else "Could not generate or execute SQL successfully."

    if not sql.startswith("ERROR"):
        t2 = time.time()
        try:
            df = conn.execute(sql).fetchdf()
            sql_ms = int((time.time() - t2) * 1000)
            
            # Format results
            columns = [ResultColumn(key=str(c), label=str(c)) for c in df.columns]
            rows = df.to_dict('records')
            
            # clean NaNs
            clean_rows = []
            for r in rows:
                clean_r = {}
                for k, v in r.items():
                    clean_r[k] = None if pd.isna(v) else v
                clean_rows.append(clean_r)
            
            total_rows = len(clean_rows)
            row_limit = _get_result_row_limit()
            visible_rows = clean_rows[:row_limit]
            result_table = ResultTable(columns=columns, rows=visible_rows, total_rows=total_rows)
            result_rows = clean_rows
            
            # 4. Generate NL Summary
            t3 = time.time()
            try:
                nl_summary = await generate_nl_summary(content, sql, result_rows)
            except Exception as e:
                nl_summary = f"Generated SQL executed successfully, but failed to generate summary: {str(e)}"
            llm_ms += int((time.time() - t3) * 1000)
            
        except Exception as e:
            sql_ms = int((time.time() - t2) * 1000)
            nl_summary = f"SQL Execution Failed: {str(e)}"

    # 5. Save assistant message
    now2 = _now()
    assistant_msg_id = f"msg-{uuid.uuid4().hex[:8]}-a"
    
    conn.execute(
        """INSERT INTO chat_messages 
        (id, session_id, role, content, created_at, sql_generated, sql_execution_ms, llm_generation_ms, result_row_count) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [assistant_msg_id, session_id, "assistant", nl_summary, now2, sql, sql_ms, llm_ms, len(result_rows)]
    )
    conn.execute("UPDATE chat_sessions SET updated_at = ? WHERE id = ?", [now2, session_id])
    
    return ChatMessageResponse(
        id=assistant_msg_id,
        session_id=session_id,
        role="assistant",
        content=nl_summary,
        created_at=now2,
        sql_generated=sql,
        sql_execution_ms=sql_ms,
        llm_generation_ms=llm_ms,
        result_row_count=len(result_rows),
        result_data=result_table,
        referenced_files=effective_refs,
        session_title=session_title,
    )


async def regenerate_response(
    session_id: str,
    content: str,
    referenced_files: list[str],
) -> ChatMessageResponse:
    """Re-run SQL generation + execution for an existing user query without inserting a new user message."""
    import uuid
    conn = get_connection()

    tables, effective_refs = _resolve_schema_tables(conn, referenced_files, content)
    schema_info = _build_schema_info(conn, tables)

    t0 = time.time()
    try:
        sql_result, _llm_msg = await generate_sql(content, schema_info)
        sql = sql_result.strip()
    except Exception as e:
        sql = f"ERROR: Failed to generate SQL: {str(e)}"
    t1 = time.time()
    llm_ms = int((t1 - t0) * 1000)

    sql_ms = 0
    result_table = None
    result_rows = []
    nl_summary = "Could not generate or execute SQL successfully."

    if not sql.startswith("ERROR"):
        t2 = time.time()
        try:
            df = conn.execute(sql).fetchdf()
            sql_ms = int((time.time() - t2) * 1000)

            columns = [ResultColumn(key=str(c), label=str(c)) for c in df.columns]
            rows = df.to_dict('records')

            clean_rows = []
            for r in rows:
                clean_r = {}
                for k, v in r.items():
                    clean_r[k] = None if pd.isna(v) else v
                clean_rows.append(clean_r)

            total_rows = len(clean_rows)
            row_limit = _get_result_row_limit()
            visible_rows = clean_rows[:row_limit]
            result_table = ResultTable(columns=columns, rows=visible_rows, total_rows=total_rows)
            result_rows = clean_rows

            t3 = time.time()
            try:
                nl_summary = await generate_nl_summary(content, sql, result_rows)
            except Exception as e:
                nl_summary = f"SQL executed, but failed to generate summary: {str(e)}"
            llm_ms += int((time.time() - t3) * 1000)

        except Exception as e:
            sql_ms = int((time.time() - t2) * 1000)
            nl_summary = f"SQL Execution Failed: {str(e)}"

    now2 = _now()
    assistant_msg_id = f"msg-{uuid.uuid4().hex[:8]}-r"

    conn.execute(
        """INSERT INTO chat_messages
        (id, session_id, role, content, created_at, sql_generated, sql_execution_ms, llm_generation_ms, result_row_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [assistant_msg_id, session_id, "assistant", nl_summary, now2, sql, sql_ms, llm_ms, len(result_rows)]
    )
    conn.execute("UPDATE chat_sessions SET updated_at = ? WHERE id = ?", [now2, session_id])

    return ChatMessageResponse(
        id=assistant_msg_id,
        session_id=session_id,
        role="assistant",
        content=nl_summary,
        created_at=now2,
        sql_generated=sql,
        sql_execution_ms=sql_ms,
        llm_generation_ms=llm_ms,
        result_row_count=len(result_rows),
        result_data=result_table,
        referenced_files=effective_refs,
    )
