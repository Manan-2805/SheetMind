"""Module containing excel_editor_router functionality."""

import asyncio
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from openai import AsyncOpenAI
from pydantic import ValidationError

from models.settings_models import get_settings
from schemas.common_schemas import SuccessResponse
from schemas.excel_editor_schemas import (
    ApplyRequest,
    FileListResponse,
    HistoryResponse,
    MutationRequest,
    MutationResponse,
    OpenFileResponse,
    RestoreRequest,
    SaveRequest,
    SheetData,
)
from schemas.excel_operations import MutationPlan
from services.excel_editor_service import (
    EditorError,
    apply_mutation_to_disk,
    get_available_files,
    get_edit_history,
    load_mutation_frame,
    open_excel_file,
    open_excel_sheet,
    restore_backup,
    save_manual_edits,
)
from services.excel_mutation_service import (
    build_mutation_prompt,
    dry_run_mutation,
)
from services.storage_service import get_debug_prompts_dir


def _write_debug_prompt(messages_or_prompt: str | list, label: str = "PROMPT") -> Path | None:
    """Write each LLM prompt call to a separate timestamped .txt file in the debug_prompts dir."""
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


router = APIRouter(prefix="/excel-editor", tags=["excel-editor"])


@router.get("/files", response_model=FileListResponse)
def list_files():
    """Execute the list_files operation."""
    files = get_available_files()
    return FileListResponse(files=files)


@router.get("/open", response_model=OpenFileResponse)
def open_file(file_id: str):
    """Execute the open_file operation."""
    if not file_id:
        raise HTTPException(status_code=400, detail="fileId is required")

    try:
        return OpenFileResponse(**open_excel_file(file_id))
    except EditorError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/sheet-data", response_model=SheetData)
def get_sheet_data(file_id: str, sheet_name: str):
    """Execute the get_sheet_data operation."""
    if not file_id or not sheet_name:
        raise HTTPException(status_code=400, detail="fileId and sheetName are required")

    try:
        return open_excel_sheet(file_id, sheet_name)
    except EditorError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/mutate", response_model=MutationResponse)
async def mutate_file(body: MutationRequest):
    # 1. Build prompt
    """Execute the mutate_file operation."""
    try:
        df = await asyncio.to_thread(
            load_mutation_frame, body.fileId, body.sheetName, len(body.currentRows), body.columns
        )
    except EditorError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    col_types = {col: str(df[col].dtype) for col in df.columns}
    sample_rows = df.head(5).values.tolist()

    prompt_msgs = build_mutation_prompt(
        user_instruction=body.userInstruction,
        sheet_name=body.sheetName,
        columns=body.columns,
        col_types=col_types,
        sample_rows=sample_rows,
        row_count=len(df),
    )
    debug_path = _write_debug_prompt(prompt_msgs, f"EXCEL_MUTATION [{body.fileId}]")

    # 2. Call LLM
    settings = get_settings()
    llm_response_text = ""

    if settings.llm_provider == "openai":
        client = AsyncOpenAI(api_key=settings.openai.api_key)
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=prompt_msgs,
            temperature=0.0,
            response_format={"type": "json_object"},
        )
        llm_response_text = response.choices[0].message.content
    else:
        url = settings.ollama.url.rstrip("/")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{url}/api/generate",
                json={
                    "model": settings.ollama.model,
                    "prompt": "\n".join([m["content"] for m in prompt_msgs]),
                    "stream": False,
                    "format": "json",
                },
                timeout=60.0,
            )
            resp.raise_for_status()
            llm_response_text = resp.json()["response"]

    try:
        plan = MutationPlan.model_validate_json(llm_response_text)
    except ValidationError as exc:
        raise HTTPException(status_code=502, detail="LLM returned an invalid editing plan") from exc

    _append_debug_response(
        debug_path, plan.model_dump(), f"EXCEL_MUTATION RESPONSE [{body.fileId}]"
    )
    try:
        diff_rows, _modified = await asyncio.to_thread(dry_run_mutation, df, plan.operations)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return MutationResponse(
        operationType=plan.operation_type,
        operations=plan.operations,
        operationSummary=plan.operation_summary,
        confidence=plan.confidence,
        diffRows=diff_rows,
        affectedRowCount=len({row["rowIndex"] for row in diff_rows}),
        followupSuggestions=plan.followup_suggestions,
    )


@router.post("/apply", response_model=SuccessResponse)
def apply_mutation(body: ApplyRequest):
    """Revalidate and apply the proposed operations."""
    try:
        apply_mutation_to_disk(
            file_id=body.fileId,
            sheet_name=body.sheetName,
            operations=body.operations,
            current_rows=body.currentRows,
            columns=body.columns,
        )
    except EditorError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return SuccessResponse(success=True)


@router.post("/save", response_model=SuccessResponse)
def save_edits(body: SaveRequest):
    """Execute the save_edits operation."""
    try:
        save_manual_edits(
            file_id=body.fileId, sheets=body.sheets, formatting_map=body.formattingMap
        )
        return SuccessResponse(success=True)
    except EditorError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/history/{file_id}", response_model=HistoryResponse)
def get_history(file_id: str):
    """Execute the get_history operation."""
    history = get_edit_history(file_id)
    return HistoryResponse(history=history)


@router.post("/restore", response_model=SuccessResponse)
def restore(body: RestoreRequest):
    """Restore the selected workbook revision."""
    try:
        restore_backup(body.fileId, body.historyId)
    except EditorError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    return SuccessResponse(success=True)
