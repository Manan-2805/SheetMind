import re
import pandas as pd
from datetime import datetime, timezone
import duckdb

def safe_table_name(file_id: str, sheet_name: str | None = None) -> str:
    base = f"file_{file_id.replace('-', '_')}"
    if sheet_name:
        base = f"{base}_{sheet_name}"
    safe = re.sub(r"[^0-9A-Za-z_]+", "_", base.strip())
    safe = re.sub(r"_+", "_", safe).strip("_")
    return safe.lower() if safe else f"file_{file_id.replace('-', '_')}"

def clean_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [str(c).strip().replace(" ", "_").replace("-", "_") for c in df.columns]
    return df

def import_df_to_duckdb(conn: duckdb.DuckDBPyConnection, df: pd.DataFrame, table_name: str):
    df = clean_columns(df)
    conn.execute(f"CREATE OR REPLACE TABLE {table_name} AS SELECT * FROM df")

def now_utc() -> datetime:
    return datetime.now(timezone.utc)
