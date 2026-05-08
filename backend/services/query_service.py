from typing import Any

import pandas as pd

from schemas.chat_schemas import ResultColumn, ResultTable


def dataframe_to_result_table(df: pd.DataFrame, row_limit: int) -> ResultTable:
    columns = [ResultColumn(key=str(c), label=str(c)) for c in df.columns]
    rows = df.to_dict("records")

    clean_rows: list[dict[str, Any]] = []
    for row in rows:
        clean_row: dict[str, Any] = {}
        for key, value in row.items():
            clean_row[key] = None if pd.isna(value) else value
        clean_rows.append(clean_row)

    total_rows = len(clean_rows)
    visible_rows = clean_rows[:row_limit]
    return ResultTable(columns=columns, rows=visible_rows, total_rows=total_rows)
