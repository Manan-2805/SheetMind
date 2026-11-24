"""Module containing llm_service functionality."""

import json
from typing import Any

import httpx
from openai import AsyncOpenAI

from models.settings_models import get_settings
from services.logging_service import get_logger


class LLMResponseError(ValueError):
    """An LLM response that cannot be used by the dashboard."""


async def generate_dashboard_layout(description: str) -> dict[str, Any]:
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
        {"role": "user", "content": description},
    ]

    return await _call_llm_json(settings, prompt_msgs)


async def generate_dashboard_name(widgets: list[dict[str, Any]]) -> str:
    """Generates a dashboard name based on the widgets it contains and their bound queries."""
    settings = get_settings()

    widgets_lines = []
    for w in widgets:
        line = f"- Widget: '{w['label']}' ({w['widget_type']})"
        if w.get("query_name"):
            line += f", Bound Query Name: '{w['query_name']}'"
        if w.get("natural_query"):
            line += f", User Ask: '{w['natural_query']}'"
        if w.get("sql_query"):
            line += f", SQL Query: '{w['sql_query']}'"
        widgets_lines.append(line)

    widgets_text = "\n".join(widgets_lines)

    system_prompt = (
        "You are a dashboard naming assistant. Analyze the widgets, query names, natural language user questions, and SQL queries to understand what data is displayed.\n"
        "Generate a short, highly professional and descriptive name for this overall dashboard (max 6 words).\n"
        "Return ONLY a valid JSON object with this structure:\n"
        "{\n"
        '  "title": "Your Suggested Name"\n'
        "}\n"
        "Provide no markdown formatting or other text, just the raw JSON object."
    )

    prompt_msgs = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Widgets & Data Context:\n{widgets_text}"},
    ]

    res = await _call_llm_json(settings, prompt_msgs)
    title = res.get("title")
    if not isinstance(title, str) or not title.strip():
        raise LLMResponseError("The LLM did not return a dashboard title.")
    return title


async def _call_llm_json(settings: Any, prompt_msgs: list[dict[str, str]]) -> dict[str, Any]:
    """Execute the _call_llm_json operation."""
    llm_response_text = ""

    if settings.llm_provider == "openai":
        client = AsyncOpenAI(api_key=settings.openai.api_key)
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=prompt_msgs,  # type: ignore
            temperature=0.7,
            response_format={"type": "json_object"},
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
                    "format": "json",
                },
                timeout=60.0,
            )
            resp.raise_for_status()
            llm_response_text = resp.json().get("message", {}).get("content", "{}")

    try:
        data = json.loads(llm_response_text)
        if not isinstance(data, dict) or not data:
            raise ValueError("Expected a nonempty JSON object")
    except (ValueError, TypeError) as exc:
        get_logger().warning("The LLM returned invalid JSON for a dashboard request")
        raise LLMResponseError("The LLM returned invalid JSON. Try again.") from exc
    return data
