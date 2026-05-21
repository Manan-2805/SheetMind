import json
from typing import Any

from fastapi import APIRouter, HTTPException
import pandas as pd

from models.settings_models import get_settings
from schemas.common_schemas import SuccessResponse
from schemas.excel_editor_schemas import (
    ApplyRequest,
    FileListResponse,
    HistoryResponse,
    MutationRequest,
    MutationResponse,
    OpenFileResponse,
    SaveRequest,
    SheetData,
)
from services.excel_editor_service import (
    apply_mutation_to_disk,
    get_available_files,
    get_edit_history,
    open_excel_file,
    open_excel_sheet,
    restore_backup,
    save_manual_edits,
)
from services.excel_mutation_service import (
    build_mutation_prompt,
    dry_run_mutation,
    validate_pandas_expression,
)
from services.storage_service import get_debug_prompts_dir
from datetime import datetime, timezone

def _write_debug_prompt(messages_or_prompt: str | list, label: str = "PROMPT") -> None:
    """Write each LLM prompt call to a separate timestamped .txt file in the debug_prompts dir."""
    debug_dir = get_debug_prompts_dir()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    safe_label = label.replace(" ", "_").replace("[", "").replace("]", "")[:60]
    filename = debug_dir / f"{timestamp}_{safe_label}.txt"
    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"[{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}] {label}\n")
            f.write("=" * 80 + "\n\n")
            if isinstance(messages_or_prompt, list):
                for i, msg in enumerate(messages_or_prompt):
                    role = msg.get("role", "unknown").upper()
                    content = msg.get("content", "")
                    f.write(f"--- [{i+1}] {role} ---\n")
                    f.write(content)
                    f.write("\n\n")
            else:
                f.write(str(messages_or_prompt))
                f.write("\n")
    except Exception as e:
        print(f"Failed to write debug prompt: {e}")


router = APIRouter(prefix="/excel-editor", tags=["excel-editor"])

@router.get("/files", response_model=FileListResponse)
async def list_files():
    files = get_available_files()
    return FileListResponse(files=files)

@router.get("/open", response_model=OpenFileResponse)
async def open_file(fileId: str):
    if not fileId:
        raise HTTPException(status_code=400, detail="fileId is required")
    
    data = open_excel_file(fileId)
    if not data:
        raise HTTPException(status_code=404, detail="File not found")
        
    return OpenFileResponse(**data)

@router.get("/sheet-data", response_model=SheetData)
async def get_sheet_data(fileId: str, sheetName: str):
    if not fileId or not sheetName:
        raise HTTPException(status_code=400, detail="fileId and sheetName are required")
        
    data = open_excel_sheet(fileId, sheetName)
    if not data:
        raise HTTPException(status_code=404, detail="Sheet not found")
        
    return data

@router.post("/mutate", response_model=MutationResponse)
async def mutate_file(body: MutationRequest):
    # 1. Build prompt
    df = pd.DataFrame(body.currentRows, columns=body.columns)
    col_types = {col: str(df[col].dtype) for col in df.columns}
    sample_rows = df.head(5).values.tolist()
    
    prompt_msgs = build_mutation_prompt(
        user_instruction=body.userInstruction,
        sheet_name=body.sheetName,
        columns=body.columns,
        col_types=col_types,
        sample_rows=sample_rows,
        row_count=len(df)
    )
    _write_debug_prompt(prompt_msgs, f"EXCEL_MUTATION [{body.fileId}]")

    
    # 2. Call LLM
    settings = get_settings()
    llm_response_text = ""
    
    if settings.llm_provider == "openai":
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai.api_key)
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=prompt_msgs,
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        llm_response_text = response.choices[0].message.content
    else:
        import httpx
        url = settings.ollama.url.rstrip("/")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{url}/api/generate",
                json={
                    "model": settings.ollama.model,
                    "prompt": "\n".join([m["content"] for m in prompt_msgs]),
                    "stream": False,
                    "format": "json"
                },
                timeout=60.0
            )
            resp.raise_for_status()
            llm_response_text = resp.json()["response"]

    # 3. Parse and Validate
    try:
        data = json.loads(llm_response_text)
    except Exception:
        # Simple retry once if parsing fails (Ollama sometimes misses JSON wrapper)
        raise HTTPException(status_code=500, detail="LLM returned invalid JSON")

    pandas_code = data.get("pandas_code", "")
    if not pandas_code:
        return MutationResponse(
            operationType=data.get("operation_type", "unknown"),
            pandasCode="",
            operationSummary=data.get("operation_summary", "No operation generated."),
            confidence=data.get("confidence", 1),
            diffRows=[],
            affectedRowCount=0,
            followupSuggestions=data.get("followup_suggestions", [])
        )

    is_safe, reason = validate_pandas_expression(pandas_code)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Safety validation failed: {reason}")

    # 4. Dry run
    try:
        diff_rows, df_modified = dry_run_mutation(
            df=df,
            pandas_code=pandas_code,
            affected_columns=data.get("affected_columns", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mutation execution failed: {str(e)}")

    return MutationResponse(
        operationType=data.get("operation_type"),
        pandasCode=pandas_code,
        operationSummary=data.get("operation_summary"),
        confidence=data.get("confidence"),
        diffRows=diff_rows,
        affectedRowCount=len(diff_rows),
        followupSuggestions=data.get("followup_suggestions", [])
    )

@router.post("/apply", response_model=SuccessResponse)
async def apply_mutation(body: ApplyRequest):
    # Re-validate for safety
    is_safe, reason = validate_pandas_expression(body.pandasCode)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Safety validation failed: {reason}")
        
    try:
        apply_mutation_to_disk(
            file_id=body.fileId,
            sheet_name=body.sheetName,
            pandas_code=body.pandasCode,
            current_rows=body.currentRows,
            columns=body.columns
        )
        return SuccessResponse(success=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save", response_model=SuccessResponse)
async def save_edits(body: SaveRequest):
    try:
        save_manual_edits(
            file_id=body.fileId,
            sheets=body.sheets,
            formatting_map=body.formattingMap
        )
        return SuccessResponse(success=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{file_id}", response_model=HistoryResponse)
async def get_history(file_id: str):
    history = get_edit_history(file_id)
    return HistoryResponse(history=history)

@router.post("/restore", response_model=SuccessResponse)
async def restore(body: dict):
    file_id = body.get("fileId")
    backup_path = body.get("backupPath")
    if not file_id or not backup_path:
        raise HTTPException(status_code=400, detail="fileId and backupPath are required")
        
    try:
        restore_backup(file_id, backup_path)
        return SuccessResponse(success=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
