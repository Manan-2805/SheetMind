import math
from typing import Any

import pandas as pd

from schemas.chat_schemas import ResultColumn, ResultTable


def dataframe_to_result_table(
    df: pd.DataFrame,
    row_limit: int,
    page: int = 1,
    page_size: int | None = None,
) -> ResultTable:
    columns = [ResultColumn(key=str(c), label=str(c)) for c in df.columns]
    rows = df.to_dict("records")

    clean_rows: list[dict[str, Any]] = []
    for row in rows:
        clean_row: dict[str, Any] = {}
        for key, value in row.items():
            clean_row[key] = None if pd.isna(value) else value
        clean_rows.append(clean_row)

    total_rows = len(clean_rows)
    p_size = page_size if page_size is not None else row_limit
    total_pages = max(1, math.ceil(total_rows / p_size))

    # Clamp page to valid range
    page = max(1, min(page, total_pages))

    start_idx = (page - 1) * p_size
    end_idx = start_idx + p_size
    visible_rows = clean_rows[start_idx:end_idx]

    return ResultTable(
        columns=columns,
        rows=visible_rows,
        total_rows=total_rows,
        page=page,
        page_size=p_size,
        total_pages=total_pages,
    )

