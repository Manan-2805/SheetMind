"""Module containing artifact_models functionality."""

import os
import uuid
from datetime import UTC, datetime

from schemas.artifact_schemas import (
    ArtifactChartResponse,
    ArtifactExportResponse,
    ArtifactsResponse,
)
from services.duckdb_service import get_connection


def _now() -> datetime:
    """Execute the _now operation."""
    return datetime.now(UTC)


def _get_source_session_name(conn, source_message_id: str | None) -> str | None:
    """Execute the _get_source_session_name operation."""
    if not source_message_id:
        return None
    row = conn.execute(
        """
        SELECT s.title
        FROM chat_messages m
        JOIN chat_sessions s ON s.id = m.session_id
        WHERE m.id = ?
        """,
        [source_message_id],
    ).fetchone()
    return row[0] if row else None


def get_all() -> ArtifactsResponse:
    """Execute the get_all operation."""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT id, type, filename, file_path, file_size_bytes, created_at, source_message_id, title
        FROM artifacts
        ORDER BY created_at DESC
        """
    ).fetchall()

    excel_exports: list[ArtifactExportResponse] = []
    charts: list[ArtifactChartResponse] = []

    for row in rows:
        (
            artifact_id,
            artifact_type,
            filename,
            file_path,
            file_size,
            created_at,
            source_message_id,
            title,
        ) = row
        if artifact_type == "excel_export":
            source_session_name = _get_source_session_name(conn, source_message_id)
            excel_exports.append(
                ArtifactExportResponse(
                    id=str(artifact_id),
                    filename=filename,
                    file_path=file_path,
                    file_size_bytes=int(file_size or 0),
                    created_at=created_at,
                    source_message_id=source_message_id,
                    source_session_name=source_session_name,
                    title=title or filename,
                )
            )
        elif artifact_type == "chart":
            source_session_name = _get_source_session_name(conn, source_message_id)
            charts.append(
                ArtifactChartResponse(
                    id=str(artifact_id),
                    chart_type="",
                    title=title or filename,
                    created_at=created_at,
                    source_message_id=source_message_id,
                    source_session_name=source_session_name,
                )
            )

    return ArtifactsResponse(excel_exports=excel_exports, charts=charts)


def create_export(
    filename: str,
    file_path: str,
    file_size_bytes: int,
    title: str,
    source_message_id: str | None,
) -> ArtifactExportResponse:
    """Execute the create_export operation."""
    conn = get_connection()
    artifact_id = f"art-{uuid.uuid4().hex[:10]}"
    created_at = _now()
    conn.execute(
        """
        INSERT INTO artifacts
        (id, type, filename, file_path, file_size_bytes, created_at, source_message_id, title)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            artifact_id,
            "excel_export",
            filename,
            file_path,
            file_size_bytes,
            created_at,
            source_message_id,
            title,
        ],
    )
    source_session_name = _get_source_session_name(conn, source_message_id)
    return ArtifactExportResponse(
        id=artifact_id,
        filename=filename,
        file_path=file_path,
        file_size_bytes=file_size_bytes,
        created_at=created_at,
        source_message_id=source_message_id,
        source_session_name=source_session_name,
        title=title,
    )


def get_by_id(artifact_id: str):
    """Execute the get_by_id operation."""
    conn = get_connection()
    return conn.execute(
        """
        SELECT id, type, filename, file_path, file_size_bytes, created_at, source_message_id, title
        FROM artifacts
        WHERE id = ?
        """,
        [artifact_id],
    ).fetchone()


def delete(artifact_id: str) -> bool:
    """Execute the delete operation."""
    conn = get_connection()
    row = get_by_id(artifact_id)
    if not row:
        return False
    _, _, _, file_path, _, _, _, _ = row
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass
    conn.execute("DELETE FROM artifacts WHERE id = ?", [artifact_id])
    return True


def rename(artifact_id: str, title: str) -> ArtifactExportResponse | None:
    """Execute the rename operation."""
    conn = get_connection()
    conn.execute("UPDATE artifacts SET title = ? WHERE id = ?", [title, artifact_id])
    row = get_by_id(artifact_id)
    if not row:
        return None
    _, _, filename, file_path, file_size, created_at, source_message_id, stored_title = row
    source_session_name = _get_source_session_name(conn, source_message_id)
    return ArtifactExportResponse(
        id=artifact_id,
        filename=filename,
        file_path=file_path,
        file_size_bytes=int(file_size or 0),
        created_at=created_at,
        source_message_id=source_message_id,
        source_session_name=source_session_name,
        title=stored_title or filename,
    )
