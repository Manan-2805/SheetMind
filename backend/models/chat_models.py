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
               token_count_output, confidence_score, result_row_count,
               parent_user_message_id, feedback, result_data_json, version,
               sql_gen_ms, summary_gen_ms, total_ms, model_name,
               followups_json, chart_suggestion
        FROM chat_messages
        WHERE session_id = ?
        ORDER BY created_at ASC
    """, [session_id]).fetchall()
    
    messages = []
    for row in result:
        res_data = None
        if row[14]:
            try:
                res_data = ResultTable(**json.loads(row[14]))
            except Exception:
                pass

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
            result_row_count=row[11],
            parent_user_message_id=row[12],
            feedback=row[13],
            result_data=res_data,
            version=row[15] or 1,
            sql_gen_ms=row[16],
            summary_gen_ms=row[17],
            total_ms=row[18],
            model_name=row[19],
            followups=json.loads(row[20]) if row[20] else None,
            chart_suggestion=row[21]
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
    max_input_tokens: int,     # from user settings
) -> list[dict]:

    system_content = """You are an expert DuckDB SQL analyst embedded in
SheetMind, a data querying desktop application.

Your job:
- Understand the user's question in the context of the conversation history.
- Generate a precise DuckDB SQL query when the question requires data retrieval
  or manipulation.
- Ask clarifying questions when the question is ambiguous or missing required
  information. Do not guess schema or column names.
- Respond conversationally when no SQL is needed (greetings, explanations,
  follow-ups to your own questions).

Available DuckDB tables:
{schema_info}

STRICT RULES — violating any of these is an error:
1. Use ONLY the exact table name strings shown above (e.g. file_abc123_sheet1).
   Never use file names, sheet names, or any other identifiers in SQL.
2. sql must ALWAYS be a string. Never return null or None.
   Use "" (empty string) when no SQL is appropriate.
3. message must ALWAYS be a non-empty string. Use it to:
   - Explain what the SQL does (when sql is present)
   - Ask the user for missing information (when sql is "")
   - Respond conversationally (when no data is needed)
4. When the question references previous results ("filter that", "sort this",
   "add region to this"), build on the last SQL query in conversation history.
5. When no tables are available or referenced, ask the user to attach a file
   using #filename in their message.
6. Never fabricate column names. If unsure, ask.
7. Respond ONLY with a valid JSON object. No prose, no markdown fences.

Required response format:
{{
  "sql": "<complete DuckDB SQL query, or empty string>",
  "message": "<explanation, clarification question, or conversational reply>",
  "confidence": <integer 1 to 5>,
  "chart_suggestion": "<bar|line|pie|scatter|area|null>"
}}""".format(schema_info=schema_info)

    messages = [{"role": "system", "content": system_content}]

    # Build history entries, add until token budget is reached
    history_blocks = []
    for turn in turn_history:  # oldest to newest, max 4 turns
        user_block = {"role": "user", "content": turn["user_message"]}
        
        assistant_parts = []
        if turn.get("bot_message"):
            assistant_parts.append(turn["bot_message"])
        if turn.get("sql_generated"):
            assistant_parts.append(f"[SQL: {turn['sql_generated']}]")
        if turn.get("sql_error"):
            assistant_parts.append(f"[Error: {turn['sql_error']}]")
        if turn.get("feedback"):
            assistant_parts.append(f"[User feedback: {turn['feedback']}]")
        
        assistant_block = {
            "role": "assistant",
            "content": "\n".join(assistant_parts)
        }
        history_blocks.append((user_block, assistant_block))

    # Token-aware history insertion
    base_tokens = estimate_tokens(system_content) + estimate_tokens(current_question)
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

    messages.append({"role": "user", "content": current_question})
    return messages


def set_message_feedback(message_id: str, feedback: str) -> None:
    conn = get_connection()
    conn.execute(
        "UPDATE chat_messages SET feedback = ? WHERE id = ?",
        [feedback, message_id]
    )

def _extract_json_sql(raw: str) -> dict[str, Any]:
    """Parse JSON response from LLM. Returns a dict with sql, message, confidence, chart_suggestion."""
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
        text = text[text.find("{"):text.rfind("}")+1]

    try:
        data = json.loads(text)
        return {
            "sql": str(data.get("sql", "")).strip(),
            "message": str(data.get("message") or ""),
            "confidence": data.get("confidence", 3),
            "chart_suggestion": data.get("chart_suggestion")
        }
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON response from LLM")


def _write_debug_prompt(prompt: str, label: str = "PROMPT") -> None:
    debug_file = "llm_prompt_debug.txt"
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    try:
        with open(debug_file, "a", encoding="utf-8") as f:
            f.write(f"\n{'='*80}\n")
            f.write(f"[{timestamp}] {label}\n")
            f.write(f"{'='*80}\n")
            f.write(prompt)
            f.write("\n")
    except Exception as e:
        print(f"Failed to write debug prompt: {e}")


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
                    if table_name and table_name.startswith("file_") and table_name not in seen_tables:
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
                    if table_name and table_name.startswith("file_") and table_name not in seen_tables:
                        tables.append({
                            "filename": filename,
                            "sheet_name": sheet_row[0],
                            "table_name": table_name,
                        })
                        seen_tables.add(table_name)

    # Removed fallback to all tables to avoid confusing the LLM.
    # Only explicitly referenced files/sheets (via #) are included in the schema context.
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


async def generate_sql(messages: list[dict]) -> dict[str, Any]:
    """Returns a dict with {sql, message, confidence, chart_suggestion, model, input_tokens, output_tokens}."""
    settings = get_settings()
    model_name = "unknown"

    fallback_res = {
        "sql": "",
        "message": "I had trouble formatting my response. Please try rephrasing your question.",
        "confidence": 1,
        "chart_suggestion": None,
        "model": "fallback",
        "input_tokens": 0,
        "output_tokens": 0
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
                    messages=messages if attempt == 0 else messages + [{"role": "user", "content": "Your last response was not valid JSON. Respond ONLY with the JSON object."}],
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
                            "prompt": "\n".join([f"{m['role']}: {m['content']}" for m in messages]) if attempt == 0 else "\n".join([f"{m['role']}: {m['content']}" for m in messages]) + "\nuser: Your last response was not valid JSON. Respond ONLY with the JSON object.",
                            "stream": False,
                            "format": "json",
                        },
                        timeout=60.0
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    content_out = data["response"]
                    input_tokens = data.get("prompt_eval_count", 0)
                    output_tokens = data.get("eval_count", 0)

            res = _extract_json_sql(content_out)
            res.update({
                "model": model_name,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens
            })
            return res

        except Exception as e:
            print(f"SQL Generation Attempt {attempt + 1} failed: {str(e)}")
            if attempt == 1:
                print(f"Final failure. Raw output: {content_out if 'content_out' in locals() else 'N/A'}")
                fallback_res.update({"model": model_name})
                return fallback_res

    return fallback_res
async def generate_nl_summary(result_rows: list, columns: list, user_question: str) -> dict[str, Any]:
    prompt = f"""Summarize this query result in 1-2 sentences in plain English.
Be specific about numbers. Do not use technical terms.

User asked: {user_question}
Columns: {columns}
First 5 rows: {result_rows[:5]}
Total rows: {len(result_rows)}

Respond with only the summary sentence. No JSON."""
    _write_debug_prompt(prompt, "NL SUMMARY")

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
            max_tokens=120
        )
        input_tokens = response.usage.prompt_tokens if response.usage else 0
        output_tokens = response.usage.completion_tokens if response.usage else 0
        return {"summary": response.choices[0].message.content.strip(), "input_tokens": input_tokens, "output_tokens": output_tokens}
    else:
        url = settings.ollama.url.rstrip("/")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{url}/api/generate",
                json={
                    "model": settings.ollama.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0, "num_predict": 120}
                },
                timeout=60.0
            )
            resp.raise_for_status()
            data = resp.json()
            input_tokens = data.get("prompt_eval_count", 0)
            output_tokens = data.get("eval_count", 0)
            return {"summary": data["response"].strip(), "input_tokens": input_tokens, "output_tokens": output_tokens}


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
                response_format={"type": "json_object"} if model.startswith("gpt-") else None
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
                        "format": "json"
                    },
                    timeout=5.0 # Aggressive timeout
                )
                resp.raise_for_status()
                text = resp.json()["response"]
        
        # Simple cleanup if not pure json
        if "[" in text and "]" in text:
            text = text[text.find("["):text.rfind("]")+1]
        
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
    prompt = f"Generate a very short, concise title (max 5 words) for a chat conversation that starts with this message: \"{content}\". Do not use quotes or prefixes, just the title text."
    _write_debug_prompt(prompt, "TITLE GENERATION")
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
    prompt = f"Create a short, human-readable label (max 6 words) for a saved SQL query.\nThe user asked: \"{nl_query}\"\nThe SQL generated: {sql_query[:200]}\nReturn ONLY the label text, no quotes, no punctuation at end."
    _write_debug_prompt(prompt, "QUERY LABEL GENERATION")
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
    parent_user_message_id: str | None = None,
) -> ChatMessageResponse:
    import uuid
    import asyncio
    now = _now()
    conn = get_connection()
    user_msg_id = f"msg-{uuid.uuid4().hex[:8]}-u"
    
    # Insert user message
    conn.execute(
        "INSERT INTO chat_messages (id, session_id, role, content, created_at, parent_user_message_id) VALUES (?, ?, ?, ?, ?, ?)",
        [user_msg_id, session_id, "user", content, now, parent_user_message_id]
    )
    
    settings = get_settings()
    tables, effective_refs = _resolve_schema_tables(conn, referenced_files, content)
    schema_info = _build_schema_info(conn, tables)

    # Fetch history for context (last 4 turns)
    history_rows = conn.execute("""
        SELECT content, sql_generated, role, feedback, id
        FROM chat_messages 
        WHERE session_id = ? AND id != ?
        ORDER BY created_at DESC LIMIT 8
    """, [session_id, user_msg_id]).fetchall()
    
    turns = []
    i = 0
    while i < len(history_rows):
        msg = history_rows[i]
        if msg[2] == "assistant":
            assistant_content = msg[0]
            sql = msg[1]
            feedback = msg[3]
            if i + 1 < len(history_rows) and history_rows[i+1][2] == "user":
                user_content = history_rows[i+1][0]
                turns.append({
                    "user_message": user_content,
                    "bot_message": assistant_content,
                    "sql_generated": sql,
                    "feedback": feedback
                })
                i += 2
            else:
                turns.append({
                    "user_message": "",
                    "bot_message": assistant_content,
                    "sql_generated": sql,
                    "feedback": feedback
                })
                i += 1
        else:
            turns.append({"user_message": msg[0]})
            i += 1
            
    turns.reverse()
    
    max_input_tokens = 6000
    if settings.llm_provider == "openai":
        max_input_tokens = settings.openai.max_input_tokens
    else:
        max_input_tokens = settings.ollama.max_input_tokens

    messages = build_sql_prompt(content, schema_info, turns, max_input_tokens)
    
    msg_count = conn.execute("SELECT COUNT(*) FROM chat_messages WHERE session_id = ?", [session_id]).fetchone()[0]
    sess_row = conn.execute("SELECT title FROM chat_sessions WHERE id = ?", [session_id]).fetchone()
    current_title = sess_row[0] if sess_row else ""
    is_first = msg_count == 1 and current_title in ("New conversation", "", None)

    t0 = time.time()
    session_title = None
    if is_first:
        title_task = generate_title(content)
        sql_task = generate_sql(messages)
        title, sql_res = await asyncio.gather(title_task, sql_task)
        conn.execute("UPDATE chat_sessions SET title = ? WHERE id = ?", [title, session_id])
        session_title = title
    else:
        sql_res = await generate_sql(messages)

    sql = sql_res.get("sql") or ""
    llm_message = sql_res.get("message") or ""
    model_name = sql_res.get("model") or "unknown"
    confidence = sql_res.get("confidence", 3)
    chart_suggestion = sql_res.get("chart_suggestion")
    total_input_tokens = sql_res.get("input_tokens", 0)
    total_output_tokens = sql_res.get("output_tokens", 0)
    sql_gen_ms = int((time.time() - t0) * 1000)

    sql_exec_ms = 0
    summary_gen_ms = 0
    result_table = None
    result_rows = []
    nl_summary = llm_message or "I'm sorry, I couldn't process that request."

    if sql:
        t2 = time.time()
        try:
            df = conn.execute(sql).fetchdf()
            sql_exec_ms = int((time.time() - t2) * 1000)
            columns = [ResultColumn(key=str(c), label=str(c)) for c in df.columns]
            rows = df.to_dict('records')
            clean_rows = []
            for r in rows:
                clean_r = {k: (None if pd.isna(v) else v) for k, v in r.items()}
                clean_rows.append(clean_r)
            
            total_rows = len(clean_rows)
            row_limit = _get_result_row_limit()
            result_table = ResultTable(columns=columns, rows=clean_rows[:row_limit], total_rows=total_rows)
            result_rows = clean_rows
            
            t3 = time.time()
            try:
                summary_res = await generate_nl_summary(result_rows, [c.key for c in columns], content)
                nl_summary = summary_res["summary"]
                total_input_tokens += summary_res.get("input_tokens", 0)
                total_output_tokens += summary_res.get("output_tokens", 0)
            except Exception as e:
                nl_summary = f"Results found, but summary failed: {e}"
            summary_gen_ms = int((time.time() - t3) * 1000)
            
        except Exception as e:
            sql_exec_ms = int((time.time() - t2) * 1000)
            nl_summary = f"SQL Error: {str(e)}"

    total_ms = int((time.time() - t0) * 1000)
    assistant_msg_id = f"msg-{uuid.uuid4().hex[:8]}-a"
    now2 = _now()
    
    res_data_json = json.dumps(result_table.dict(), default=str) if result_table else None
    conn.execute(
        """INSERT INTO chat_messages 
        (id, session_id, role, content, created_at, sql_generated, sql_execution_ms, llm_generation_ms, 
         token_count_input, token_count_output, result_row_count, parent_user_message_id, result_data_json, version,
         sql_gen_ms, summary_gen_ms, total_ms, model_name, confidence_score, chart_suggestion) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [assistant_msg_id, session_id, "assistant", nl_summary, now2, sql, sql_exec_ms, sql_gen_ms + summary_gen_ms, 
         total_input_tokens, total_output_tokens, len(result_rows), user_msg_id, res_data_json, 1,
         sql_gen_ms, summary_gen_ms, total_ms, model_name, confidence, chart_suggestion]
    )
    conn.execute("UPDATE chat_sessions SET updated_at = ? WHERE id = ?", [now2, session_id])

    async def _bg_followups():
        if result_rows:
            fups = await generate_followups(result_rows, [c.key for c in columns], content)
            if fups:
                conn_bg = get_connection()
                conn_bg.execute("UPDATE chat_messages SET followups_json = ? WHERE id = ?", [json.dumps(fups), assistant_msg_id])

    asyncio.create_task(_bg_followups())

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
        chart_suggestion=chart_suggestion
    )


async def regenerate_response(
    session_id: str,
    content: str,
    referenced_files: list[str],
    parent_user_message_id: str | None = None,
) -> ChatMessageResponse:
    """Re-run SQL generation + execution for an existing user query without inserting a new user message."""
    import uuid
    import asyncio
    conn = get_connection()

    tables, effective_refs = _resolve_schema_tables(conn, referenced_files, content)
    schema_info = _build_schema_info(conn, tables)

    history_rows = conn.execute("""
        SELECT content, sql_generated, role, feedback, id
        FROM chat_messages 
        WHERE session_id = ? AND id != ?
        ORDER BY created_at DESC LIMIT 8
    """, [session_id, parent_user_message_id]).fetchall()
    
    turns = []
    i = 0
    while i < len(history_rows):
        msg = history_rows[i]
        if msg[2] == "assistant":
            assistant_content = msg[0]
            sql = msg[1]
            feedback = msg[3]
            if i + 1 < len(history_rows) and history_rows[i+1][2] == "user":
                user_content = history_rows[i+1][0]
                turns.append({"user_message": user_content, "bot_message": assistant_content, "sql_generated": sql, "feedback": feedback})
                i += 2
            else:
                turns.append({"user_message": "", "bot_message": assistant_content, "sql_generated": sql, "feedback": feedback})
                i += 1
        else:
            turns.append({"user_message": msg[0]})
            i += 1
    turns.reverse()
    
    settings = get_settings()
    max_input_tokens = 6000
    if settings.llm_provider == "openai":
        max_input_tokens = settings.openai.max_input_tokens
    else:
        max_input_tokens = settings.ollama.max_input_tokens

    messages = build_sql_prompt(content, schema_info, turns, max_input_tokens)

    t0 = time.time()
    sql_res = await generate_sql(messages)
    sql = sql_res.get("sql") or ""
    llm_message = sql_res.get("message") or ""
    model_name = sql_res.get("model") or "unknown"
    confidence = sql_res.get("confidence", 3)
    chart_suggestion = sql_res.get("chart_suggestion")
    total_input_tokens = sql_res.get("input_tokens", 0)
    total_output_tokens = sql_res.get("output_tokens", 0)
    sql_gen_ms = int((time.time() - t0) * 1000)

    sql_exec_ms = 0
    summary_gen_ms = 0
    result_table = None
    result_rows = []
    nl_summary = llm_message or "I'm sorry, I couldn't process that request."

    if sql:
        t2 = time.time()
        try:
            df = conn.execute(sql).fetchdf()
            sql_exec_ms = int((time.time() - t2) * 1000)
            columns = [ResultColumn(key=str(c), label=str(c)) for c in df.columns]
            rows = df.to_dict('records')
            clean_rows = [{k: (None if pd.isna(v) else v) for k, v in r.items()} for r in rows]
            total_rows = len(clean_rows)
            row_limit = _get_result_row_limit()
            result_table = ResultTable(columns=columns, rows=clean_rows[:row_limit], total_rows=total_rows)
            result_rows = clean_rows
            
            t3 = time.time()
            try:
                summary_res = await generate_nl_summary(result_rows, [c.key for c in columns], content)
                nl_summary = summary_res["summary"]
                total_input_tokens += summary_res.get("input_tokens", 0)
                total_output_tokens += summary_res.get("output_tokens", 0)
            except Exception as e:
                nl_summary = f"Results found, but summary failed: {e}"
            summary_gen_ms = int((time.time() - t3) * 1000)
        except Exception as e:
            sql_exec_ms = int((time.time() - t2) * 1000)
            nl_summary = f"SQL Error: {str(e)}"

    total_ms = int((time.time() - t0) * 1000)
    now2 = _now()
    assistant_msg_id = f"msg-{uuid.uuid4().hex[:8]}-r"

    v_row = conn.execute("SELECT MAX(version) FROM chat_messages WHERE parent_user_message_id = ?", [parent_user_message_id]).fetchone()
    next_version = (v_row[0] or 1) + 1 if v_row and v_row[0] else 1

    res_data_json = json.dumps(result_table.dict(), default=str) if result_table else None
    conn.execute(
        """INSERT INTO chat_messages
        (id, session_id, role, content, created_at, sql_generated, sql_execution_ms, llm_generation_ms, 
         token_count_input, token_count_output, result_row_count, parent_user_message_id, result_data_json, version,
         sql_gen_ms, summary_gen_ms, total_ms, model_name, confidence_score, chart_suggestion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [assistant_msg_id, session_id, "assistant", nl_summary, now2, sql, sql_exec_ms, sql_gen_ms + summary_gen_ms, 
         total_input_tokens, total_output_tokens, len(result_rows), parent_user_message_id, res_data_json, next_version,
         sql_gen_ms, summary_gen_ms, total_ms, model_name, confidence, chart_suggestion]
    )
    conn.execute("UPDATE chat_sessions SET updated_at = ? WHERE id = ?", [now2, session_id])

    async def _bg_followups():
        if result_rows:
            fups = await generate_followups(result_rows, [c.key for c in columns], content)
            if fups:
                conn_bg = get_connection()
                conn_bg.execute("UPDATE chat_messages SET followups_json = ? WHERE id = ?", [json.dumps(fups), assistant_msg_id])

    asyncio.create_task(_bg_followups())

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
        chart_suggestion=chart_suggestion
    )


def delete_message_branch(session_id: str, message_id: str) -> None:
    """Deletes a message and all subsequent messages in the same session."""
    conn = get_connection()
    row = conn.execute("SELECT created_at FROM chat_messages WHERE id = ?", [message_id]).fetchone()
    if not row:
        raise ValueError("Message not found")
    target_time = row[0]
    conn.execute("DELETE FROM chat_messages WHERE session_id = ? AND created_at >= ?", [session_id, target_time])
    conn.execute("UPDATE chat_sessions SET updated_at = ? WHERE id = ?", [_now(), session_id])


async def edit_user_message(session_id: str, message_id: str, new_content: str, referenced_files: list[str]) -> ChatMessageResponse:
    """Edits a user message by deleting it and all subsequent messages, then re-sending."""
    conn = get_connection()
    row = conn.execute("SELECT created_at FROM chat_messages WHERE id = ?", [message_id]).fetchone()
    if not row:
        raise ValueError("Message not found")
    target_time = row[0]
    conn.execute("DELETE FROM chat_messages WHERE session_id = ? AND created_at >= ?", [session_id, target_time])
    return await create_message(session_id, new_content, referenced_files)
