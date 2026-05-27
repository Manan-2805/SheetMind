"""Module containing llm_service functionality."""

import json
from typing import Any, Dict, List

import httpx
from openai import AsyncOpenAI

from models.settings_models import get_settings

async def generate_dashboard_layout(description: str) -> Dict[str, Any]:
    """Generates a dashboard layout (title + widgets) based on user description."""
    settings = get_settings()

    system_prompt = (
        "You are a dashboard layout assistant. Based on the user's description, suggest a dashboard layout.\n"
        "Return ONLY a valid JSON object with the following structure:\n"
        "{\n"
        '  "title": "A short, descriptive title",\n'
        '  "widgets": [\n'
        '    {"label": "Widget label", "widget_type": "KpiWidget | ChartWidget | TableWidget"}\n'
        "  ]\n"
        "}\n"
        "Provide no markdown formatting or other text, just the raw JSON object."
    )

    prompt_msgs = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": description}
    ]

    return await _call_llm_json(settings, prompt_msgs)

async def generate_dashboard_name(widgets: List[Dict[str, str]]) -> str:
    """Generates a dashboard name based on the widgets it contains."""
    settings = get_settings()

    widgets_text = ", ".join([f"{w['label']} ({w['widget_type']})" for w in widgets])

    system_prompt = (
        "You are a dashboard naming assistant. Based on the widgets provided, suggest a short, descriptive dashboard name.\n"
        "Return ONLY a valid JSON object with this structure:\n"
        "{\n"
        '  "title": "Your Suggested Name"\n'
        "}\n"
        "Provide no markdown formatting or other text, just the raw JSON object."
    )

    prompt_msgs = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Widgets: {widgets_text}"}
    ]

    res = await _call_llm_json(settings, prompt_msgs)
    return res.get("title", "Untitled Dashboard")

async def _call_llm_json(settings: Any, prompt_msgs: List[Dict[str, str]]) -> Dict[str, Any]:
    """Execute the _call_llm_json operation."""
    llm_response_text = ""

    if settings.llm_provider == "openai":
        client = AsyncOpenAI(api_key=settings.openai.api_key)
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=prompt_msgs, # type: ignore
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        llm_response_text = response.choices[0].message.content or "{}"
    else:
        url = settings.ollama.url.rstrip("/")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{url}/api/chat",
                json={
                    "model": settings.ollama.model,
                    "messages": prompt_msgs,
                    "stream": False,
                    "format": "json"
                },
                timeout=60.0
            )
            resp.raise_for_status()
            llm_response_text = resp.json().get("message", {}).get("content", "{}")

    try:
        data = json.loads(llm_response_text)
        return data
    except Exception:
        return {}
