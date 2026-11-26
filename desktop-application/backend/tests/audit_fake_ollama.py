"""Deterministic Ollama substitute for the audit workbook only."""

import json
import re

from fastapi import FastAPI, HTTPException

app = FastAPI()


@app.get("/api/tags")
def models():
    """Advertise the synthetic audit model."""
    return {"models": [{"name": "audit-fake"}]}


@app.post("/api/generate")
def generate(body: dict):
    """Answer the audit prompts without calling an external service."""
    prompt = body["prompt"]
    if "primary edit type" in prompt:
        content = {
            "operation_type": "value_update",
            "operations": [
                {
                    "type": "value_update",
                    "column": "amount",
                    "value": {"op": "add", "args": [{"col": "amount"}, {"const": 10}]},
                }
            ],
            "operation_summary": "Add 10 to each amount",
            "confidence": 5,
            "affected_columns": ["amount"],
            "followup_suggestions": [],
        }
    elif "chart configuration" in prompt:
        content = {
            "summary": "The sample amounts are sorted.",
            "chart_config": {
                "should_generate": True,
                "chart_type": "bar",
                "x_key": "label",
                "y_key": "amount",
            },
            "followups": ["Show another page?"],
        }
    elif "very short, concise title" in prompt:
        return {"response": "Audit workbook"}
    else:
        match = re.search(r"DuckDB Table Name: (file_\w+)", prompt)
        if match is None:
            raise HTTPException(400, "Upload the synthetic audit workbook first.")
        content = {
            "sql": f"SELECT label, amount FROM {match[1]} ORDER BY amount",
            "message": "Synthetic results",
            "confidence": 5,
        }
    return {"response": json.dumps(content), "prompt_eval_count": 3, "eval_count": 4}
