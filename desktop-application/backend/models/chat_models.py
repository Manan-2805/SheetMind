"""Module containing chat_models functionality."""

import asyncio
import json
import math
import re
import time
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import httpx
import pandas as pd
from openai import AsyncOpenAI

from models import artifact_models
from models.settings_models import get_settings
from schemas.chat_schemas import (
    ChatMessageResponse,
    ChatSessionResponse,
    ResultColumn,
    ResultTable,
)
from services.chart_service import generate_chart
from services.duckdb_service import get_connection
from services.logging_service import get_logger
from services.query_service import dataframe_to_result_table
from services.storage_service import (
    get_charts_dir,
    get_debug_prompts_dir,
    get_exports_dir,
)


def _now() -> datetime:
    """Execute the _now operation."""
    return datetime.now(UTC)


def _ago(days: int = 0, hours: int = 0, minutes: int = 0) -> datetime:
    """Execute the _ago operation."""
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
        {
            "customer_name": "Acme Corp",
            "region": "North America",
            "total_revenue": 482930.50,
            "orders_count": 142,
            "avg_order_value": 3401.62,
        },
        {
            "customer_name": "GlobalTech Ltd",
            "region": "Europe",
            "total_revenue": 371200.00,
            "orders_count": 98,
            "avg_order_value": 3787.76,
        },
        {
            "customer_name": "Pacific Ventures",
            "region": "Asia Pacific",
            "total_revenue": 298450.75,
            "orders_count": 87,
            "avg_order_value": 3430.47,
        },
        {
            "customer_name": "Sunrise Industries",
            "region": "North America",
            "total_revenue": 241800.20,
            "orders_count": 76,
            "avg_order_value": 3181.58,
        },
        {
            "customer_name": "Delta Systems",
            "region": "Europe",
            "total_revenue": 198340.90,
            "orders_count": 65,
            "avg_order_value": 3051.40,
        },
        {
            "customer_name": "Orion Group",
            "region": "Latin America",
            "total_revenue": 176520.00,
            "orders_count": 54,
            "avg_order_value": 3269.00,
        },
        {
            "customer_name": "Meridian Co",
            "region": "Middle East",
            "total_revenue": 154300.45,
            "orders_count": 48,
            "avg_order_value": 3214.59,
        },
        {
            "customer_name": "Nexus Partners",
            "region": "North America",
            "total_revenue": 132780.30,
            "orders_count": 41,
            "avg_order_value": 3238.54,
        },
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


def get_sessions() -> list[ChatSessionResponse]:
    """Execute the get_sessions operation."""
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
        sessions.append(
            ChatSessionResponse(
                id=row[0],
                title=row[1],
                created_at=row[2],
                updated_at=row[3],
                is_favorite=row[4],
                message_count=row[5],
            )
        )
    return sessions


def get_messages(session_id: str) -> list[ChatMessageResponse]:
    """Execute the get_messages operation."""
    conn = get_connection()
    result = conn.execute(
        """
         SELECT id, session_id, role, content, created_at, sql_generated,
             sql_execution_ms, llm_generation_ms, token_count_input,
             token_count_output, confidence_score, result_row_count,
             parent_user_message_id, feedback, feedback_reason, result_data_json, version,
             sql_gen_ms, summary_gen_ms, total_ms, model_name,
             followups_json
        FROM chat_messages
        WHERE session_id = ?
        ORDER BY created_at ASC
    """,
        [session_id],
    ).fetchall()

    messages = []
    for row in result:
        res_data = None
        if row[15]:
            try:
                res_data = ResultTable(**json.loads(row[15]))
            except Exception:
                pass

        messages.append(
            ChatMessageResponse(
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
                result_row_count=row[11],
                parent_user_message_id=row[12],
                feedback=row[13],
                feedback_reason=row[14],
                result_data=res_data,
                version=row[16] or 1,
                sql_gen_ms=row[17],
                summary_gen_ms=row[18],
                total_ms=row[19],
                model_name=row[20],
                followups=json.loads(row[21]) if row[21] else None,
            )
        )
    return messages


def create_session(title: str | None = None) -> ChatSessionResponse:
    """Execute the create_session operation."""
    now = _now()
    session_id = f"sess-{uuid.uuid4().hex[:8]}"
    title = title or "New conversation"
    conn = get_connection()
    conn.execute(
        "INSERT INTO chat_sessions (id, title, created_at, updated_at, is_favorite) VALUES (?, ?, ?, ?, ?)",
        [session_id, title, now, now, False],
    )
    return ChatSessionResponse(
        id=session_id,
        title=title,
        created_at=now,
        updated_at=now,
        is_favorite=False,
        message_count=0,
    )


def update_session(
    session_id: str, title: str | None = None, is_favorite: bool | None = None
) -> ChatSessionResponse:
    """Execute the update_session operation."""
    conn = get_connection()
    if title is not None:
        conn.execute(
            "UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?",
            [title, _now(), session_id],
        )
    if is_favorite is not None:
        conn.execute(
            "UPDATE chat_sessions SET is_favorite = ?, updated_at = ? WHERE id = ?",
            [is_favorite, _now(), session_id],
        )

    # fetch updated session
    row = conn.execute(
        "SELECT id, title, created_at, updated_at, is_favorite FROM chat_sessions WHERE id = ?",
        [session_id],
    ).fetchone()
    if row:
        return ChatSessionResponse(
            id=row[0],
            title=row[1],
            created_at=row[2],
            updated_at=row[3],
            is_favorite=row[4],
            message_count=0,
        )
    raise ValueError("Session not found")


def delete_session(session_id: str):
    """Execute the delete_session operation."""
    conn = get_connection()
    conn.execute("DELETE FROM chat_messages WHERE session_id = ?", [session_id])
    conn.execute("DELETE FROM chat_sessions WHERE id = ?", [session_id])


def estimate_tokens(text: str) -> int:
    """
    Fast approximation without loading a tokenizer library.
    Rule: 1 token ≈ 4 characters for English + SQL mixed content.
    Add 10% buffer for safety.
    """
    return int((len(text) / 4) * 1.1)


def build_sql_prompt(
    current_question: str,
    schema_info: str,
    turn_history: list[dict],  # last 4 turns from DB, oldest first
    max_input_tokens: int,  # from user settings
) -> list[dict]:
    """Execute the build_sql_prompt operation."""
    system_content = """You are an expert DuckDB SQL analyst embedded in
SheetMind, a data querying desktop application.

Your job:
- Understand the user's question in the context of the conversation history.
- Generate a precise DuckDB SQL query when the question requires data retrieval
  or manipulation.
- Boldly map terms used in the user's prompt to the closest logically matching column names available in the schema. Do not hesitate or ask for clarification if a requested field loosely matches an available column header (e.g. 'city' -> 'Warehouse City' or 'Location'). Confidently write the working SQL query immediately.
- Automatically construct valid DuckDB JOIN queries using logical relational keys when multiple tables or files are required or referenced to answer the question.
- Respond conversationally when no SQL is needed (greetings, explanations).

STRICT RULES — violating any of these is an error:
1. Use ONLY the exact table name strings shown above (e.g. file_abc123_sheet1).
   Never use file names, sheet names, or any other identifiers in SQL.
2. sql must ALWAYS be a string containing the complete working query. Never return null or None.
   Use "" (empty string) when no SQL is appropriate.
3. message must ALWAYS be a non-empty string. Use it to:
   - Explain concisely what the SQL does (when sql is present)
   - Ask the user for missing information ONLY as an absolute last resort if the request is completely incomprehensible
   - Respond conversationally (when no data is needed)
4. When the question references previous results ("filter that", "sort this",
   "add region to this"), build on the last SQL query in conversation history.
5. When no tables are available or referenced, ask the user to attach a file
   using #filename in their message.
6. Respond ONLY with a valid JSON object. No prose, no markdown fences.
7. CRITICAL: Never ask conversational confirmation questions like "Should I run this SQL?", "Would you like me to query this?", or "Would you like me to analyze X?". Confidently write and execute the SQL immediately! Do not ask the user for confirmation first.

The current user question is always the block labeled "CURRENT USER QUESTION".
Conversation history appears before it for context.

Required response format:
{
    "sql": "<complete working DuckDB SQL query, or empty string>",
    "message": "<explanation, clarification question, or conversational reply>",
    "confidence": <integer 1 to 5>
}"""

    schema_content = f"Available DuckDB tables:\n{schema_info}"
    current_question_block = "\n".join(
        [
            "=== CURRENT USER QUESTION ===",
            current_question,
            "=== END QUESTION ===",
        ]
    )

    messages = [
        {"role": "system", "content": system_content},
        {"role": "system", "content": schema_content},
    ]

    # Build history entries, add until token budget is reached
    history_blocks = []
    for turn in turn_history:  # oldest to newest, max 4 turns
        user_text = turn["user_message"] or ""
        user_block = {
            "role": "user",
            "content": f"[Previous user message - context only]\n{user_text}",
        }

        assistant_parts = []
        if turn.get("bot_message"):
            assistant_parts.append(turn["bot_message"])
        feedback = turn.get("feedback")
        feedback_reason = turn.get("feedback_reason")
        if feedback:
            if feedback_reason:
                assistant_parts.append(f"[User feedback: {feedback} - {feedback_reason}]")
            else:
                assistant_parts.append(f"[User feedback: {feedback}]")
        if turn.get("sql_generated"):
            assistant_parts.append(f"[SQL: {turn['sql_generated']}]")
        if turn.get("sql_error"):
            assistant_parts.append(f"[SQL Error: {turn['sql_error']}]")

        assistant_block = {
            "role": "assistant",
            "content": "\n".join(
                ["[Previous assistant response - context only]"] + assistant_parts
            ),
        }
        history_blocks.append((user_block, assistant_block))

    # Token-aware history insertion
    base_tokens = (
        estimate_tokens(system_content)
        + estimate_tokens(schema_content)
        + estimate_tokens(current_question_block)
    )
    token_budget = max_input_tokens - base_tokens - 500  # 500 reserve for response

    inserted = []
    for user_block, assistant_block in reversed(history_blocks):
        cost = estimate_tokens(user_block["content"]) + estimate_tokens(assistant_block["content"])
        if cost > token_budget:
            break
        inserted.insert(0, (user_block, assistant_block))
        token_budget -= cost

    for user_block, assistant_block in inserted:
        messages.append(user_block)
        messages.append(assistant_block)

    messages.append({"role": "user", "content": current_question_block})
    return messages


def _collect_schema_refs(
    conn,
    referenced_files: list[str],
    content: str,
    turns: list[dict[str, Any]],
) -> list[str]:
    """Execute the _collect_schema_refs operation."""
    refs = [r for r in referenced_files if r.strip()]
    if not refs:
        refs = _extract_references_from_content(conn, content)

    history_refs: list[str] = []
    for turn in turns:
        history_refs.extend(turn.get("referenced_files") or [])

    combined: list[str] = []
    seen = set()
    for ref in refs + history_refs:
        ref = ref.strip() if isinstance(ref, str) else ""
        if ref and ref not in seen:
            combined.append(ref)
            seen.add(ref)

    if not combined:
        rows = conn.execute("SELECT id FROM excel_files WHERE status = 'completed'").fetchall()
        for r in rows:
            file_id = r[0]
            if file_id not in seen:
                combined.append(file_id)
                seen.add(file_id)

    return combined


def _extract_table_names_from_sql(sql: str) -> list[str]:
    """Execute the _extract_table_names_from_sql operation."""
    if not sql:
        return []
    return re.findall(r"\bfile_[0-9A-Za-z_]+\b", sql)


def _extract_table_names_from_turns(turns: list[dict[str, Any]]) -> list[str]:
    """Execute the _extract_table_names_from_turns operation."""
    names: list[str] = []
    seen = set()
    for turn in turns:
        sql = turn.get("sql_generated") or ""
        for name in _extract_table_names_from_sql(sql):
            if name not in seen:
                names.append(name)
                seen.add(name)
    return names


def _resolve_tables_by_name(conn, table_names: list[str]) -> list[dict[str, str]]:
    """Execute the _resolve_tables_by_name operation."""
    if not table_names:
        return []

    placeholders = ", ".join(["?"] * len(table_names))
    rows = conn.execute(
        f"""
        SELECT f.original_filename, s.sheet_name, s.table_name
        FROM excel_sheets s
        JOIN excel_files f ON f.id = s.excel_file_id
        WHERE s.table_name IN ({placeholders}) AND f.status = 'completed'
        """,
        table_names,
    ).fetchall()

    entries: dict[str, dict[str, str]] = {}
    for filename, sheet_name, table_name in rows:
        entries[str(table_name)] = {
            "filename": str(filename),
            "sheet_name": str(sheet_name),
            "table_name": str(table_name),
        }

    return [entries[name] for name in table_names if name in entries]


def _merge_table_entries(
    base: list[dict[str, str]],
    extra: list[dict[str, str]],
) -> list[dict[str, str]]:
    """Execute the _merge_table_entries operation."""
    seen = {entry.get("table_name") for entry in base}
    for entry in extra:
        table_name = entry.get("table_name")
        if table_name and table_name not in seen:
            base.append(entry)
            seen.add(table_name)
    return base


def _get_recent_turns(
    conn,
    session_id: str,
    exclude_message_id: str | None = None,
    limit_pairs: int = 4,
) -> list[dict[str, Any]]:
    """Execute the _get_recent_turns operation."""
    params: list[Any] = [session_id]
    user_query = """
        SELECT id, content, created_at, referenced_files_json
        FROM chat_messages
        WHERE session_id = ? AND role = 'user'
    """
    if exclude_message_id:
        user_query += " AND id != ?"
        params.append(exclude_message_id)
    user_query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit_pairs * 4)

    user_rows = conn.execute(user_query, params).fetchall()
    turns: list[dict[str, Any]] = []

    for user_id, user_content, _created_at, ref_files_raw in user_rows:
        assistant_row = conn.execute(
            """
            SELECT content, sql_generated, feedback, feedback_reason, created_at, version
            FROM chat_messages
            WHERE parent_user_message_id = ? AND role = 'assistant'
            ORDER BY COALESCE(version, 1) DESC, created_at DESC
            LIMIT 1
            """,
            [user_id],
        ).fetchone()

        if not assistant_row:
            continue

        assistant_content, sql, feedback, feedback_reason, _a_created_at, _version = assistant_row
        sql_error = (
            assistant_content
            if assistant_content and str(assistant_content).startswith("SQL Error:")
            else None
        )
        ref_files = json.loads(ref_files_raw) if ref_files_raw else []

        turns.append(
            {
                "user_message": user_content or "",
                "bot_message": assistant_content or "",
                "sql_generated": sql,
                "feedback": feedback,
                "feedback_reason": feedback_reason,
                "sql_error": sql_error,
                "referenced_files": ref_files,
            }
        )

        if len(turns) >= limit_pairs:
            break

    turns.reverse()
    return turns


def set_message_feedback(message_id: str, feedback: str, reason: str | None = None) -> None:
    """Execute the set_message_feedback operation."""
    conn = get_connection()
    conn.execute(
        "UPDATE chat_messages SET feedback = ?, feedback_reason = ? WHERE id = ?",
        [feedback, reason, message_id],
    )


def _extract_json_sql(raw: str) -> dict[str, Any]:
    """Parse JSON response from LLM. Returns a dict with sql, message, confidence."""
    text = raw.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.splitlines()
        # Find start and end of json block
        start_idx = 1
        end_idx = len(lines)
        if lines[-1].strip() == "```":
            end_idx = -1
        text = "\n".join(lines[start_idx:end_idx])

    # Clean up any leading/trailing non-json characters (sometimes LLMs add prose)
    if "{" in text and "}" in text:
        text = text[text.find("{") : text.rfind("}") + 1]

    try:
        data = json.loads(text)
        return {
            "sql": str(data.get("sql", "")).strip(),
            "message": str(data.get("message") or ""),
            "confidence": data.get("confidence", 3),
        }
    except json.JSONDecodeError as exc:
        raise ValueError("Invalid JSON response from LLM") from exc


def _write_debug_prompt(messages_or_prompt: str | list, label: str = "PROMPT") -> Path | None:
    """Write each LLM prompt call to a separate timestamped .txt file in the debug_prompts dir and return the path."""
    debug_dir = get_debug_prompts_dir()
    timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S_%f")
    safe_label = label.replace(" ", "_").replace("[", "").replace("]", "")[:60]
    filename = debug_dir / f"{timestamp}_{safe_label}.txt"
    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"[{datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S UTC')}] {label}\n")
            f.write("=" * 80 + "\n\n")
            if isinstance(messages_or_prompt, list):
                for i, msg in enumerate(messages_or_prompt):
                    role = msg.get("role", "unknown").upper()
                    content = msg.get("content", "")
                    f.write(f"--- [{i + 1}] {role} ---\n")
                    f.write(content)
                    f.write("\n\n")
            else:
                f.write(str(messages_or_prompt))
                f.write("\n")
        return filename
    except Exception as e:
        print(f"Failed to write debug prompt: {e}")
        return None


def _append_debug_response(
    filepath: Path | None, response_content: Any, label: str = "RESPONSE"
) -> None:
    """Append the LLM response content to the existing debug prompt file."""
    if not filepath or not filepath.exists():
        return
    try:
        with open(filepath, "a", encoding="utf-8") as f:
            f.write("\n" + "=" * 80 + "\n")
            f.write(f"[{datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S UTC')}] {label}\n")
            f.write("=" * 80 + "\n\n")
            if isinstance(response_content, (dict, list)):
                f.write(json.dumps(response_content, indent=2))
            else:
                f.write(str(response_content))
            f.write("\n")
    except Exception as e:
        print(f"Failed to append debug response: {e}")


def _split_reference(value: str) -> tuple[str, str | None]:
    """Execute the _split_reference operation."""
    if "::" in value:
        filename, sheet_name = value.split("::", 1)
        return filename.strip(), sheet_name.strip() or None
    if ":" in value:
        filename, sheet_name = value.split(":", 1)
        return filename.strip(), sheet_name.strip() or None
    return value.strip(), None


def _extract_references_from_content(conn, content: str) -> list[str]:
    """Execute the _extract_references_from_content operation."""
    if not content:
        return []

    file_rows = conn.execute(
        "SELECT id, original_filename FROM excel_files WHERE status = 'completed'"
    ).fetchall()
    if not file_rows:
        return []

    sheets_rows = conn.execute("SELECT excel_file_id, sheet_name FROM excel_sheets").fetchall()
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


def _resolve_schema_tables(
    conn, referenced_files: list[str], content: str
) -> tuple[list[dict[str, str]], list[str]]:
    """Execute the _resolve_schema_tables operation."""
    effective_refs = [r for r in referenced_files if r.strip()]
    if not effective_refs:
        effective_refs = _extract_references_from_content(conn, content)

    tables: list[dict[str, str]] = []
    seen_tables: set[str] = set()

    if effective_refs:
        for ref in effective_refs:
            filename, sheet_name = _split_reference(ref)
            # 1. Verify file exists and belongs to user (status=completed)
            file_row = conn.execute(
                "SELECT id FROM excel_files WHERE original_filename = ? AND status = 'completed'",
                [filename],
            ).fetchone()
            if not file_row:
                continue
            file_id = str(file_row[0])

            # 2. Query only from excel_sheets to get valid table_names
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
                    # DOUBLE CHECK: table_name must start with file_ (SheetMind naming convention)
                    if (
                        table_name
                        and table_name.startswith("file_")
                        and table_name not in seen_tables
                    ):
                        tables.append(
                            {
                                "filename": filename,
                                "sheet_name": sheet_row[0],
                                "table_name": table_name,
                            }
                        )
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
                    if (
                        table_name
                        and table_name.startswith("file_")
                        and table_name not in seen_tables
                    ):
                        tables.append(
                            {
                                "filename": filename,
                                "sheet_name": sheet_row[0],
                                "table_name": table_name,
                            }
                        )
                        seen_tables.add(table_name)

    # Removed fallback to all tables to avoid confusing the LLM.
    # Only explicitly referenced files/sheets (via #) are included in the schema context.
    return tables, effective_refs


def _build_schema_info(conn, tables: list[dict[str, str]]) -> str:
    """Execute the _build_schema_info operation."""
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
    """Execute the _get_result_row_limit operation."""
    settings = get_settings()
    limit = settings.result_row_limit if hasattr(settings, "result_row_limit") else 500
    try:
        limit = int(limit)
    except Exception:
        limit = 500
    return max(1, limit)


def _get_message_sql(conn, message_id: str) -> tuple[str, str]:
    """Execute the _get_message_sql operation."""
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


def get_message_data(message_id: str, page: int = 1, page_size: int | None = None) -> ResultTable:
    """Execute the get_message_data operation."""
    conn = get_connection()
    sql, _session_id = _get_message_sql(conn, message_id)
    try:
        df = conn.execute(sql).fetchdf()
    except Exception as exc:
        raise ValueError(f"SQL Execution Failed: {exc!s}") from exc
    return dataframe_to_result_table(df, _get_result_row_limit(), page=page, page_size=page_size)


def export_message(message_id: str):
    """Execute the export_message operation."""
    conn = get_connection()
    sql, session_id = _get_message_sql(conn, message_id)
    try:
        df = conn.execute(sql).fetchdf()
    except Exception as exc:
        raise ValueError(f"SQL Execution Failed: {exc!s}") from exc

    session_row = conn.execute(
        "SELECT title FROM chat_sessions WHERE id = ?",
        [session_id],
    ).fetchone()
    session_title = session_row[0] if session_row and session_row[0] else "Chat export"

    exports_dir = get_exports_dir()
    safe_title = re.sub(r"[^0-9A-Za-z_]+", "_", session_title).strip("_") or "chat_export"
    timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
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


async def generate_sql(messages: list[dict]) -> dict[str, Any]:
    """Returns a dict with {sql, message, confidence, model, input_tokens, output_tokens}."""
    settings = get_settings()
    model_name = "unknown"

    fallback_res = {
        "sql": "",
        "message": "I had trouble formatting my response. Please try rephrasing your question.",
        "confidence": 1,
        "model": "fallback",
        "input_tokens": 0,
        "output_tokens": 0,
    }

    for attempt in range(2):
        try:
            input_tokens = 0
            output_tokens = 0
            content_out = ""

            if settings.llm_provider == "openai":
                client = AsyncOpenAI(api_key=settings.openai.api_key)
                model_name = settings.openai.model
                response = await client.chat.completions.create(
                    model=model_name,
                    messages=messages
                    if attempt == 0
                    else messages
                    + [
                        {
                            "role": "user",
                            "content": "Your last response was not valid JSON. Respond ONLY with the JSON object.",
                        }
                    ],
                    temperature=0,
                    response_format={"type": "json_object"},
                )
                content_out = response.choices[0].message.content or "{}"
                input_tokens = response.usage.prompt_tokens if response.usage else 0
                output_tokens = response.usage.completion_tokens if response.usage else 0
            else:
                url = settings.ollama.url.rstrip("/")
                model_name = settings.ollama.model
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        f"{url}/api/generate",
                        json={
                            "model": model_name,
                            "prompt": "\n".join([f"{m['role']}: {m['content']}" for m in messages])
                            if attempt == 0
                            else "\n".join([f"{m['role']}: {m['content']}" for m in messages])
                            + "\nuser: Your last response was not valid JSON. Respond ONLY with the JSON object.",
                            "stream": False,
                            "format": "json",
                        },
                        timeout=60.0,
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    content_out = data["response"]
                    input_tokens = data.get("prompt_eval_count", 0)
                    output_tokens = data.get("eval_count", 0)

            res = _extract_json_sql(content_out)
            res.update(
                {"model": model_name, "input_tokens": input_tokens, "output_tokens": output_tokens}
            )
            return res

        except Exception as e:
            print(f"SQL Generation Attempt {attempt + 1} failed: {e!s}")
            if attempt == 1:
                print(
                    f"Final failure. Raw output: {content_out if 'content_out' in locals() else 'N/A'}"
                )
                fallback_res.update({"model": model_name})
                return fallback_res

    return fallback_res


async def generate_nl_summary(
    result_rows: list, columns: list, user_question: str
) -> dict[str, Any]:
    """Execute the generate_nl_summary operation."""
    prompt = f"""Summarize this query result in 1-2 sentences in plain English.
Be specific about numbers. Do not use technical terms.

User asked: {user_question}
Columns: {columns}
First 5 rows: {result_rows[:5]}
Total rows: {len(result_rows)}

Respond with only the summary sentence. No JSON."""
    debug_path = _write_debug_prompt(prompt, "NL SUMMARY")

    settings = get_settings()
    input_tokens = 0
    output_tokens = 0

    if settings.llm_provider == "openai":
        client = AsyncOpenAI(api_key=settings.openai.api_key)
        # Use gpt-4o-mini for summary if available, otherwise default
        model = "gpt-4o-mini" if settings.openai.model == "gpt-4o" else settings.openai.model
        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=120,
        )
        input_tokens = response.usage.prompt_tokens if response.usage else 0
        output_tokens = response.usage.completion_tokens if response.usage else 0
        res = {
            "summary": response.choices[0].message.content.strip(),
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
        }
        _append_debug_response(debug_path, res, "NL SUMMARY RESPONSE")
        return res
    else:
        url = settings.ollama.url.rstrip("/")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{url}/api/generate",
                json={
                    "model": settings.ollama.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0, "num_predict": 120},
                },
                timeout=60.0,
            )
            resp.raise_for_status()
            data = resp.json()
            input_tokens = data.get("prompt_eval_count", 0)
            output_tokens = data.get("eval_count", 0)
            res = {
                "summary": data["response"].strip(),
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
            }
            _append_debug_response(debug_path, res, "NL SUMMARY RESPONSE")
            return res


async def generate_followups(result_rows: list, columns: list, user_question: str) -> list[str]:
    """Generates 3 follow-up questions. Completely silent on failure."""
    try:
        prompt = f"""Generate exactly 3 short follow-up questions a user might ask
next based on this data query result. Each question must be answerable from the
same data. Each question must be under 12 words. Return ONLY a JSON array of
3 strings. No prose, no markdown.

User asked: {user_question}
Columns: {columns}
Row count: {len(result_rows)}"""

        settings = get_settings()
        if settings.llm_provider == "openai":
            client = AsyncOpenAI(api_key=settings.openai.api_key)
            model = "gpt-4o-mini" if settings.openai.model == "gpt-4o" else settings.openai.model
            response = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=150,
                response_format={"type": "json_object"} if model.startswith("gpt-") else None,
            )
            text = response.choices[0].message.content or "[]"
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
                    timeout=20.0,  # Allow for cold-start latency
                )
                resp.raise_for_status()
                text = resp.json()["response"]

        # Simple cleanup if not pure json
        if "[" in text and "]" in text:
            text = text[text.find("[") : text.rfind("]") + 1]

        data = json.loads(text)
        if isinstance(data, list):
            return data[:3]
        if isinstance(data, dict):
            # Sometimes LLMs wrap it in an object
            for val in data.values():
                if isinstance(val, list):
                    return val[:3]
        return []
    except Exception as e:
        print(f"Silent follow-up failure: {e}")
        return []


async def generate_title(content: str) -> str:
    """Execute the generate_title operation."""
    prompt = f'Generate a very short, concise title (max 5 words) for a chat conversation that starts with this message: "{content}". Do not use quotes or prefixes, just the title text.'
    debug_path = _write_debug_prompt(prompt, "TITLE GENERATION")
    settings = get_settings()
    if settings.llm_provider == "openai":
        client = AsyncOpenAI(api_key=settings.openai.api_key)
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        res = response.choices[0].message.content.strip()
        _append_debug_response(debug_path, res, "TITLE GENERATION RESPONSE")
        return res
    else:
        url = settings.ollama.url.rstrip("/")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{url}/api/generate",
                json={"model": settings.ollama.model, "prompt": prompt, "stream": False},
                timeout=30.0,
            )
            resp.raise_for_status()
            res = resp.json()["response"].strip()
            _append_debug_response(debug_path, res, "TITLE GENERATION RESPONSE")
            return res


async def generate_query_label(nl_query: str, sql_query: str) -> str:
    """Execute the generate_query_label operation."""
    prompt = f'Create a short, human-readable label (max 6 words) for a saved SQL query.\nThe user asked: "{nl_query}"\nThe SQL generated: {sql_query[:200]}\nReturn ONLY the label text, no quotes, no punctuation at end.'
    debug_path = _write_debug_prompt(prompt, "QUERY LABEL GENERATION")
    settings = get_settings()
    if settings.llm_provider == "openai":
        client = AsyncOpenAI(api_key=settings.openai.api_key)
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        res = response.choices[0].message.content.strip()
        _append_debug_response(debug_path, res, "QUERY LABEL GENERATION RESPONSE")
        return res
    else:
        url = settings.ollama.url.rstrip("/")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{url}/api/generate",
                json={"model": settings.ollama.model, "prompt": prompt, "stream": False},
                timeout=30.0,
            )
            resp.raise_for_status()
            res = resp.json()["response"].strip()
            _append_debug_response(debug_path, res, "QUERY LABEL GENERATION RESPONSE")
            return res


_ws_clients: set = set()


async def _broadcast_ws_event(session_id: str, payload: dict) -> None:
    """Broadcast an event to all connected WebSocket clients."""
    payload_copy = dict(payload)
    payload_copy["session_id"] = session_id
    logger = get_logger()
    logger.info("WebSocket Broadcast (chat/sql): session_id=%s, data=%s", session_id, payload)
    dead = set()
    for ws in list(_ws_clients):
        try:
            await ws.send_json(payload_copy)
        except Exception:
            dead.add(ws)
    _ws_clients.difference_update(dead)


async def broadcast_datasource_status() -> None:
    """Broadcast current datasource status list to all connected WebSocket clients."""
    logger = get_logger()
    try:
        conn = get_connection()
        rows = conn.execute(
            "SELECT id, status, error_message, row_count, column_count FROM excel_files"
        ).fetchall()
        updates = [
            {
                "id": r[0],
                "status": r[1],
                "error_message": r[2],
                "row_count": r[3],
                "column_count": r[4],
            }
            for r in rows
        ]
        logger.info(
            "WebSocket Broadcast (status_update): data_sources_count=%d", len(updates)
        )
        
        dead = set()
        for ws in list(_ws_clients):
            try:
                await ws.send_json({"type": "status_update", "data": updates})
            except Exception:
                dead.add(ws)
        _ws_clients.difference_update(dead)
    except Exception as e:
        logger.error("Failed to broadcast datasource status: %s", e)


async def _generate_combined_second_call(
    result_rows: list,
    columns: list,
    user_question: str,
) -> dict:
    """Single second LLM call returning summary, chart config, and followups JSON."""
    prompt = f"""You are a data analysis assistant. Based on the query result below, provide:
1. A 1-2 sentence plain English summary of what the data shows. Be specific about numbers.
2. An optimal plottable chart configuration ONLY if the data can be plotted visually in a useful way (e.g. trends, category distributions, comparisons). Choose the chart type from: "bar", "horizontal-bar", "line", "area", "pie", "donut", "scatter", "histogram", "heatmap".
3. Exactly 3 short follow-up questions (max 12 words each) a user might ask next.

User asked: {user_question}
Columns: {columns}
First 5 rows: {result_rows[:5]}
Total rows: {len(result_rows)}

Respond ONLY with this JSON (no markdown, no prose):
{{
  "summary": "<1-2 sentence summary>",
  "chart_config": {{
    "should_generate": true_or_false,
    "chart_type": "bar_or_line_or_pie_etc",
    "x_key": "<column name for x axis>",
    "y_key": "<column name for y axis>",
    "title": "<short chart title>"
  }},
  "followups": ["<q1>", "<q2>", "<q3>"]
}}"""

    settings = get_settings()
    try:
        if settings.llm_provider == "openai":
            client = AsyncOpenAI(api_key=settings.openai.api_key)
            model = "gpt-4o-mini" if settings.openai.model == "gpt-4o" else settings.openai.model
            response = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=300,
                response_format={"type": "json_object"},
            )
            text = response.choices[0].message.content or "{}"
            in_tok = response.usage.prompt_tokens if response.usage else 0
            out_tok = response.usage.completion_tokens if response.usage else 0
        else:
            url = settings.ollama.url.rstrip("/")
            async with httpx.AsyncClient() as hclient:
                resp = await hclient.post(
                    f"{url}/api/generate",
                    json={
                        "model": settings.ollama.model,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json",
                        "options": {"temperature": 0, "num_predict": 300},
                    },
                    timeout=60.0,
                )
                resp.raise_for_status()
                data = resp.json()
                text = data.get("response", "{}")
                in_tok = data.get("prompt_eval_count", 0)
                out_tok = data.get("eval_count", 0)

        if "{" in text and "}" in text:
            text = text[text.find("{") : text.rfind("}") + 1]
        parsed = json.loads(text)
        return {
            "summary": parsed.get("summary", ""),
            "followups": parsed.get("followups", [])[:3],
            "chart_config": parsed.get("chart_config", {}),
            "input_tokens": in_tok,
            "output_tokens": out_tok,
        }
    except Exception:
        return {
            "summary": "",
            "followups": [],
            "chart_config": {},
            "input_tokens": 0,
            "output_tokens": 0,
        }


async def _auto_generate_chart(
    result_rows: list,
    columns: list,
    user_question: str,
    _session_id: str,
    chart_config: dict | None = None,
) -> str | None:
    """Auto-generate a chart and return the URL path."""
    if len(columns) < 1 or len(result_rows) < 2:
        return None

    # Default fallback chart configuration
    should_gen = True
    chart_type = "bar"
    x_key = columns[0]
    y_key = columns[1] if len(columns) > 1 else columns[0]
    title = user_question[:60]

    if chart_config:
        should_gen = bool(chart_config.get("should_generate", True))
        if not should_gen:
            return None

        cfg_x = chart_config.get("x_key")
        cfg_y = chart_config.get("y_key")
        cfg_type = chart_config.get("chart_type")
        cfg_title = chart_config.get("title")

        if cfg_type:
            chart_type = str(cfg_type).lower()
        if cfg_x in columns:
            x_key = str(cfg_x)
        if cfg_y in columns:
            y_key = str(cfg_y)
        if cfg_title:
            title = str(cfg_title)

    charts_dir = get_charts_dir()
    chart_filename = f"auto_{uuid.uuid4().hex[:8]}.png"
    chart_path = charts_dir / chart_filename

    try:
        buf = generate_chart(
            data=result_rows,
            chart_type=chart_type,
            x_key=x_key,
            y_key=y_key,
            title=title,
        )
        chart_path.write_bytes(buf.read())
        return f"/api/chat/charts/static/{chart_filename}"
    except Exception as e:
        print(f"Failed inside generate_chart during auto plot: {e}")
        return None


async def create_message(
    session_id: str,
    content: str,
    referenced_files: list[str],
    parent_user_message_id: str | None = None,
) -> ChatMessageResponse:
    """Execute the create_message operation."""
    now = _now()
    conn = get_connection()
    user_msg_id = f"msg-{uuid.uuid4().hex[:8]}-u"

    # Insert user message
    conn.execute(
        "INSERT INTO chat_messages (id, session_id, role, content, created_at, parent_user_message_id, referenced_files_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            user_msg_id,
            session_id,
            "user",
            content,
            now,
            parent_user_message_id,
            json.dumps(referenced_files),
        ],
    )

    settings = get_settings()
    turns = _get_recent_turns(conn, session_id, exclude_message_id=user_msg_id, limit_pairs=4)

    # 1. Gathering files
    await _broadcast_ws_event(session_id, {"type": "chat_status", "status": "gathering_files"})
    _, effective_refs = _resolve_schema_tables(conn, referenced_files, content)
    schema_refs = _collect_schema_refs(conn, referenced_files, content, turns)
    schema_tables, _schema_effective = _resolve_schema_tables(conn, schema_refs, content)
    history_table_names = _extract_table_names_from_turns(turns)
    schema_tables = _merge_table_entries(
        schema_tables, _resolve_tables_by_name(conn, history_table_names)
    )
    schema_info = _build_schema_info(conn, schema_tables)

    max_input_tokens = 6000
    if settings.llm_provider == "openai":
        max_input_tokens = settings.openai.max_input_tokens
    else:
        max_input_tokens = settings.ollama.max_input_tokens

    # 2. Preparing prompt
    await _broadcast_ws_event(session_id, {"type": "chat_status", "status": "preparing_prompt"})
    messages = build_sql_prompt(content, schema_info, turns, max_input_tokens)
    debug_path = _write_debug_prompt(messages, f"SQL_GENERATION [{session_id}]")

    msg_count = conn.execute(
        "SELECT COUNT(*) FROM chat_messages WHERE session_id = ?", [session_id]
    ).fetchone()[0]
    sess_row = conn.execute("SELECT title FROM chat_sessions WHERE id = ?", [session_id]).fetchone()
    current_title = sess_row[0] if sess_row else ""
    is_first = msg_count == 1 and current_title in ("New conversation", "", None)

    t0 = time.time()
    session_title = None

    # 3. Generating SQL
    await _broadcast_ws_event(session_id, {"type": "chat_status", "status": "generating_sql"})
    if is_first:
        title_task = generate_title(content)
        sql_task = generate_sql(messages)
        title, sql_res = await asyncio.gather(title_task, sql_task)
        conn.execute("UPDATE chat_sessions SET title = ? WHERE id = ?", [title, session_id])
        session_title = title
    else:
        sql_res = await generate_sql(messages)

    _append_debug_response(debug_path, sql_res, f"SQL_GENERATION RESPONSE [{session_id}]")

    sql = sql_res.get("sql") or ""
    llm_message = sql_res.get("message") or ""
    model_name = sql_res.get("model") or "unknown"
    confidence = sql_res.get("confidence", 3)
    total_input_tokens = sql_res.get("input_tokens", 0)
    total_output_tokens = sql_res.get("output_tokens", 0)
    sql_gen_ms = int((time.time() - t0) * 1000)

    sql_exec_ms = 0
    summary_gen_ms = 0
    result_table = None
    result_rows: list[dict] = []
    columns: list[ResultColumn] = []
    nl_summary = llm_message or "I'm sorry, I couldn't process that request."
    sql_error: str | None = None
    followups_from_combined: list[str] = []
    chart_url: str | None = None

    if sql:
        t2 = time.time()
        sql_exec_succeeded = False
        auto_retry = settings.auto_sql_retry
        max_retries = settings.auto_sql_retry_max if auto_retry else 0
        retry_count = 0
        current_sql = sql
        failed_attempts = []

        while retry_count <= max_retries:
            try:
                await _broadcast_ws_event(
                    session_id, {"type": "chat_status", "status": "executing_sql"}
                )
                df = conn.execute(current_sql).fetchdf()
                sql_exec_ms = int((time.time() - t2) * 1000)
                columns = [ResultColumn(key=str(c), label=str(c)) for c in df.columns]
                rows_raw = df.to_dict("records")
                clean_rows = [
                    {k: (None if pd.isna(v) else v) for k, v in r.items()} for r in rows_raw
                ]
                result_rows = clean_rows
                sql = current_sql
                sql_exec_succeeded = True
                break
            except Exception as exec_err:
                sql_exec_ms = int((time.time() - t2) * 1000)
                sql_error = str(exec_err)
                failed_attempts.append({"sql": current_sql, "error": sql_error})
                if auto_retry and retry_count < max_retries:
                    retry_count += 1
                    await _broadcast_ws_event(
                        session_id, {"type": "chat_status", "status": "fixing_sql"}
                    )
                    await _broadcast_ws_event(
                        session_id,
                        {
                            "type": "sql_retry",
                            "attempt": retry_count,
                            "max": max_retries,
                            "error": sql_error,
                        },
                    )

                    failed_attempts_str = ""
                    for idx, attempt in enumerate(failed_attempts):
                        failed_attempts_str += f"\nAttempt {idx + 1} SQL:\n{attempt['sql']}\nAttempt {idx + 1} Error:\n{attempt['error']}\n"

                    retry_content = (
                        f"{content}\n\n"
                        f"The SQL generated so far has failed execution. Here is the list of previous failed SQL attempts and their errors:\n"
                        f"{failed_attempts_str}\n"
                        f"CRITICAL: Do NOT generate the same SQL queries that failed. Analyze the errors, learn from them, "
                        f"and generate a different, corrected SQL query that will execute successfully and avoid these errors."
                    )
                    retry_messages = build_sql_prompt(
                        retry_content, schema_info, turns, max_input_tokens
                    )
                    retry_debug_path = _write_debug_prompt(
                        retry_messages, f"SQL_RETRY_{retry_count} [{session_id}]"
                    )
                    retry_res = await generate_sql(retry_messages)
                    _append_debug_response(
                        retry_debug_path, retry_res, f"SQL_RETRY_{retry_count} RESPONSE"
                    )
                    current_sql = retry_res.get("sql") or ""
                    if not current_sql:
                        break
                else:
                    break

        if sql_exec_succeeded:
            await _broadcast_ws_event(
                session_id, {"type": "chat_status", "status": "generating_summary"}
            )
            t3 = time.time()
            chart_config_from_combined = None
            try:
                combined_res = await _generate_combined_second_call(
                    result_rows=result_rows,
                    columns=[c.key for c in columns],
                    user_question=content,
                )
                nl_summary = combined_res.get("summary") or llm_message or "Query completed."
                followups_from_combined = combined_res.get("followups") or []
                chart_config_from_combined = combined_res.get("chart_config")
                total_input_tokens += combined_res.get("input_tokens", 0)
                total_output_tokens += combined_res.get("output_tokens", 0)
            except Exception as e:
                nl_summary = f"Results found, but summary failed: {e}"
            summary_gen_ms = int((time.time() - t3) * 1000)
        else:
            nl_summary = f"SQL Error: {sql_error}"

    row_limit = _get_result_row_limit()
    total_db_rows = len(result_rows)
    if result_rows:
        page = 1
        page_size = row_limit
        total_pages = max(1, math.ceil(total_db_rows / page_size))
        result_table = ResultTable(
            columns=columns,
            rows=result_rows[:row_limit],
            total_rows=total_db_rows,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    chart_url = None
    if result_rows and settings.auto_chart_display:
        await _broadcast_ws_event(
            session_id, {"type": "chat_status", "status": "generating_charts"}
        )
        try:
            chart_url = await _auto_generate_chart(
                result_rows=result_rows,
                columns=[c.key for c in columns],
                user_question=content,
                _session_id=session_id,
                chart_config=chart_config_from_combined,
            )
        except Exception as e:
            print(f"Auto chart generation failed: {e}")

    total_ms = int((time.time() - t0) * 1000)
    assistant_msg_id = f"msg-{uuid.uuid4().hex[:8]}-a"
    now2 = _now()

    res_data_json = json.dumps(result_table.model_dump(), default=str) if result_table else None
    conn.execute(
        """INSERT INTO chat_messages
        (id, session_id, role, content, created_at, sql_generated, sql_execution_ms, llm_generation_ms,
         token_count_input, token_count_output, result_row_count, parent_user_message_id, result_data_json, version,
         sql_gen_ms, summary_gen_ms, total_ms, model_name, confidence_score, chart_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            assistant_msg_id,
            session_id,
            "assistant",
            nl_summary,
            now2,
            sql,
            sql_exec_ms,
            sql_gen_ms + summary_gen_ms,
            total_input_tokens,
            total_output_tokens,
            len(result_rows),
            user_msg_id,
            res_data_json,
            1,
            sql_gen_ms,
            summary_gen_ms,
            total_ms,
            model_name,
            confidence,
            chart_url,
        ],
    )
    conn.execute("UPDATE chat_sessions SET updated_at = ? WHERE id = ?", [now2, session_id])

    followups: list[str] = []
    if result_rows and followups_from_combined:
        followups = followups_from_combined
        conn.execute(
            "UPDATE chat_messages SET followups_json = ? WHERE id = ?",
            [json.dumps(followups), assistant_msg_id],
        )

    await _broadcast_ws_event(session_id, {"type": "chat_status", "status": "complete"})

    return ChatMessageResponse(
        id=assistant_msg_id,
        session_id=session_id,
        role="assistant",
        content=nl_summary,
        created_at=now2,
        sql_generated=sql,
        sql_execution_ms=sql_exec_ms,
        llm_generation_ms=sql_gen_ms + summary_gen_ms,
        token_count_input=total_input_tokens,
        token_count_output=total_output_tokens,
        result_row_count=len(result_rows),
        result_data=result_table,
        referenced_files=effective_refs,
        session_title=session_title,
        parent_user_message_id=user_msg_id,
        sql_gen_ms=sql_gen_ms,
        summary_gen_ms=summary_gen_ms,
        total_ms=total_ms,
        model_name=model_name,
        confidence_score=confidence,
        followups=followups,
        chart_url=chart_url,
    )


async def regenerate_response(
    session_id: str,
    content: str,
    referenced_files: list[str],
    parent_user_message_id: str | None = None,
) -> ChatMessageResponse:
    """Re-run SQL generation + execution for an existing user query without inserting a new user message."""
    conn = get_connection()

    # Query and append previous SQL error/query
    prev_sql = None
    prev_error = None
    if parent_user_message_id:
        prev_row = conn.execute(
            """SELECT sql_generated, content FROM chat_messages
               WHERE session_id = ? AND role = 'assistant' AND parent_user_message_id = ?
               ORDER BY version DESC LIMIT 1""",
            [session_id, parent_user_message_id],
        ).fetchone()
        if prev_row:
            prev_sql = prev_row[0]
            if prev_row[1] and ("SQL Error:" in prev_row[1] or "error" in prev_row[1].lower()):
                prev_error = prev_row[1]

    effective_content = content
    if prev_sql and prev_error:
        effective_content = f"{content}\n\n[Previous SQL failed: {prev_error}\nSQL attempted: {prev_sql}\nPlease fix and generate a valid SQL query.]"

    turns = _get_recent_turns(
        conn, session_id, exclude_message_id=parent_user_message_id, limit_pairs=4
    )

    await _broadcast_ws_event(session_id, {"type": "chat_status", "status": "gathering_files"})
    _, effective_refs = _resolve_schema_tables(conn, referenced_files, effective_content)
    schema_refs = _collect_schema_refs(conn, referenced_files, effective_content, turns)
    schema_tables, _schema_effective = _resolve_schema_tables(conn, schema_refs, effective_content)
    history_table_names = _extract_table_names_from_turns(turns)
    schema_tables = _merge_table_entries(
        schema_tables, _resolve_tables_by_name(conn, history_table_names)
    )
    schema_info = _build_schema_info(conn, schema_tables)

    settings = get_settings()
    max_input_tokens = 6000
    if settings.llm_provider == "openai":
        max_input_tokens = settings.openai.max_input_tokens
    else:
        max_input_tokens = settings.ollama.max_input_tokens

    await _broadcast_ws_event(session_id, {"type": "chat_status", "status": "preparing_prompt"})
    messages = build_sql_prompt(effective_content, schema_info, turns, max_input_tokens)
    debug_path = _write_debug_prompt(messages, f"SQL_REGENERATE [{session_id}]")

    await _broadcast_ws_event(session_id, {"type": "chat_status", "status": "generating_sql"})
    t0 = time.time()
    sql_res = await generate_sql(messages)
    _append_debug_response(debug_path, sql_res, f"SQL_REGENERATE RESPONSE [{session_id}]")
    sql = sql_res.get("sql") or ""
    llm_message = sql_res.get("message") or ""
    model_name = sql_res.get("model") or "unknown"
    confidence = sql_res.get("confidence", 3)
    total_input_tokens = sql_res.get("input_tokens", 0)
    total_output_tokens = sql_res.get("output_tokens", 0)
    sql_gen_ms = int((time.time() - t0) * 1000)

    sql_exec_ms = 0
    summary_gen_ms = 0
    result_table = None
    result_rows = []
    nl_summary = llm_message or "I'm sorry, I couldn't process that request."
    chart_config_from_combined = None
    followups = []

    if sql:
        await _broadcast_ws_event(session_id, {"type": "chat_status", "status": "executing_sql"})
        t2 = time.time()
        try:
            df = conn.execute(sql).fetchdf()
            sql_exec_ms = int((time.time() - t2) * 1000)
            columns = [ResultColumn(key=str(c), label=str(c)) for c in df.columns]
            rows = df.to_dict("records")
            clean_rows = [{k: (None if pd.isna(v) else v) for k, v in r.items()} for r in rows]
            total_rows = len(clean_rows)
            row_limit = _get_result_row_limit()
            page = 1
            page_size = row_limit
            total_pages = max(1, math.ceil(total_rows / page_size))
            result_table = ResultTable(
                columns=columns,
                rows=clean_rows[:row_limit],
                total_rows=total_rows,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
            )
            result_rows = clean_rows

            await _broadcast_ws_event(
                session_id, {"type": "chat_status", "status": "generating_summary"}
            )
            t3 = time.time()
            chart_config_from_combined = None
            try:
                combined_res = await _generate_combined_second_call(
                    result_rows=result_rows,
                    columns=[c.key for c in columns],
                    user_question=effective_content,
                )
                nl_summary = combined_res.get("summary") or "Query completed."
                followups = combined_res.get("followups") or []
                chart_config_from_combined = combined_res.get("chart_config")
                total_input_tokens += combined_res.get("input_tokens", 0)
                total_output_tokens += combined_res.get("output_tokens", 0)
            except Exception as e:
                nl_summary = f"Results found, but summary failed: {e}"
            summary_gen_ms = int((time.time() - t3) * 1000)
        except Exception as e:
            sql_exec_ms = int((time.time() - t2) * 1000)
            nl_summary = f"SQL Error: {e!s}"

    chart_url = None
    if result_rows and settings.auto_chart_display:
        await _broadcast_ws_event(
            session_id, {"type": "chat_status", "status": "generating_charts"}
        )
        try:
            chart_url = await _auto_generate_chart(
                result_rows=result_rows,
                columns=[c.key for c in columns],
                user_question=effective_content,
                _session_id=session_id,
                chart_config=chart_config_from_combined,
            )
        except Exception as e:
            print(f"Auto chart generation failed: {e}")

    total_ms = int((time.time() - t0) * 1000)
    now2 = _now()
    assistant_msg_id = f"msg-{uuid.uuid4().hex[:8]}-r"

    v_row = conn.execute(
        "SELECT MAX(version) FROM chat_messages WHERE parent_user_message_id = ?",
        [parent_user_message_id],
    ).fetchone()
    next_version = (v_row[0] or 1) + 1 if v_row and v_row[0] else 1

    res_data_json = json.dumps(result_table.model_dump(), default=str) if result_table else None
    conn.execute(
        """INSERT INTO chat_messages
        (id, session_id, role, content, created_at, sql_generated, sql_execution_ms, llm_generation_ms,
         token_count_input, token_count_output, result_row_count, parent_user_message_id, result_data_json, version,
            sql_gen_ms, summary_gen_ms, total_ms, model_name, confidence_score, chart_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            assistant_msg_id,
            session_id,
            "assistant",
            nl_summary,
            now2,
            sql,
            sql_exec_ms,
            sql_gen_ms + summary_gen_ms,
            total_input_tokens,
            total_output_tokens,
            len(result_rows),
            parent_user_message_id,
            res_data_json,
            next_version,
            sql_gen_ms,
            summary_gen_ms,
            total_ms,
            model_name,
            confidence,
            chart_url,
        ],
    )
    conn.execute("UPDATE chat_sessions SET updated_at = ? WHERE id = ?", [now2, session_id])

    if result_rows and followups:
        conn.execute(
            "UPDATE chat_messages SET followups_json = ? WHERE id = ?",
            [json.dumps(followups), assistant_msg_id],
        )

    await _broadcast_ws_event(session_id, {"type": "chat_status", "status": "complete"})

    return ChatMessageResponse(
        id=assistant_msg_id,
        session_id=session_id,
        role="assistant",
        content=nl_summary,
        created_at=now2,
        sql_generated=sql,
        sql_execution_ms=sql_exec_ms,
        llm_generation_ms=sql_gen_ms + summary_gen_ms,
        token_count_input=total_input_tokens,
        token_count_output=total_output_tokens,
        result_row_count=len(result_rows),
        result_data=result_table,
        referenced_files=effective_refs,
        parent_user_message_id=parent_user_message_id,
        version=next_version,
        sql_gen_ms=sql_gen_ms,
        summary_gen_ms=summary_gen_ms,
        total_ms=total_ms,
        model_name=model_name,
        confidence_score=confidence,
        followups=followups,
        chart_url=chart_url,
    )


def delete_message_branch(session_id: str, message_id: str) -> None:
    """Deletes a message and all subsequent messages in the same session."""
    conn = get_connection()
    row = conn.execute("SELECT created_at FROM chat_messages WHERE id = ?", [message_id]).fetchone()
    if not row:
        raise ValueError("Message not found")
    target_time = row[0]
    conn.execute(
        "DELETE FROM chat_messages WHERE session_id = ? AND created_at >= ?",
        [session_id, target_time],
    )
    conn.execute("UPDATE chat_sessions SET updated_at = ? WHERE id = ?", [_now(), session_id])


async def edit_user_message(
    session_id: str, message_id: str, new_content: str, referenced_files: list[str]
) -> ChatMessageResponse:
    """Edits a user message by deleting it and all subsequent messages, then re-sending."""
    conn = get_connection()
    row = conn.execute("SELECT created_at FROM chat_messages WHERE id = ?", [message_id]).fetchone()
    if not row:
        raise ValueError("Message not found")
    target_time = row[0]
    conn.execute(
        "DELETE FROM chat_messages WHERE session_id = ? AND created_at >= ?",
        [session_id, target_time],
    )
    return await create_message(session_id, new_content, referenced_files)
