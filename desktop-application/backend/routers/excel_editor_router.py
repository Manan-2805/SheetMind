"""Module containing excel_editor_router functionality."""

import asyncio

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
from services.logging_service import get_logger
from services.prompt_debug_service import append_debug_response, write_debug_prompt

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
    debug_path = write_debug_prompt(prompt_msgs, "EXCEL_MUTATION")

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
        get_logger().warning("The LLM returned an invalid spreadsheet edit plan")
        raise HTTPException(status_code=502, detail="LLM returned an invalid editing plan") from exc

    append_debug_response(debug_path, plan.model_dump(), "EXCEL_MUTATION RESPONSE")
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
