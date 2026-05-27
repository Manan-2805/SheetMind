"""Module containing excel_mutation_service functionality."""

import ast

import pandas as pd

ALLOWED_NODES = frozenset({
    ast.Expression, ast.Assign, ast.AugAssign,
    ast.BinOp, ast.UnaryOp, ast.BoolOp, ast.Compare,
    ast.Constant, ast.Name, ast.Attribute, ast.Subscript,
    ast.Index, ast.Slice, ast.Call, ast.keyword,
    ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Mod, ast.Pow,
    ast.FloorDiv, ast.USub, ast.UAdd,
    ast.Eq, ast.NotEq, ast.Lt, ast.LtE, ast.Gt, ast.GtE,
    ast.And, ast.Or, ast.Not,
    ast.List, ast.Tuple,
    ast.IfExp, ast.Lambda,
    ast.Load, ast.Store,
})

BLOCKED_NAMES = frozenset({
    'eval', 'exec', 'open', 'import', '__import__',
    'os', 'sys', 'subprocess', 'shutil', 'pathlib',
    'globals', 'locals', 'vars', 'dir', 'getattr', 'setattr',
    'delattr', 'hasattr', 'compile', 'breakpoint',
})

def build_mutation_prompt(
    user_instruction: str,
    sheet_name: str,
    columns: list[str],
    col_types: dict[str, str],
    sample_rows: list[list],
    row_count: int,
) -> list[dict]:
    """Execute the build_mutation_prompt operation."""
    system = """You are an expert data transformation assistant embedded in
SheetMind, an Excel editing application.

Your job: analyze the user's instruction and generate a precise pandas
operation to transform the provided spreadsheet data.

Available sheet information:
Sheet name: {sheet_name}
Columns: {columns}
Column types: {col_types}
Total rows: {row_count}
Sample rows (first 5):
{sample_rows}

STRICT RULES:
1. Respond ONLY with a valid JSON object. No prose, no markdown fences.
2. operation_type must be one of:
   value_update | formula_injection | row_delete | value_fill |
   column_add | column_delete | row_add
3. pandas_code must be a single Python expression or assignment that operates
   on a variable named `df` (a pandas DataFrame).
   - DO NOT include import statements.
   - DO NOT use eval(), exec(), open(), os, sys, or any file operations.
   - DO NOT assign to any variable other than `df` or `df[column_name]`.
   - For formula_injection: set the target column to a string formula,
     e.g. df['Total'] = '=A' + (df.index + 2).astype(str) + '*B' + ...
   - Use only: arithmetic, comparison, string operations, pandas methods
     (.str, .apply with lambda, .fillna, .where, .mask, .drop, .assign)
4. affected_columns: list of column names that will change.
5. operation_summary: one sentence describing what the operation does.
   Plain English, no technical terms.
6. If the instruction is ambiguous or cannot be safely executed, set
   pandas_code to "" and explain in operation_summary.
7. confidence: integer 1-5 (your confidence in the correctness of this
   operation for the user's intent).

Required response format:
{{
  "operation_type": "<type>",
  "pandas_code": "<single expression or empty string>",
  "affected_columns": ["col1", "col2"],
  "operation_summary": "<plain english summary>",
  "confidence": <1-5>,
  "followup_suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}}""".format(
        sheet_name=sheet_name,
        columns=columns,
        col_types=col_types,
        row_count=row_count,
        sample_rows=sample_rows[:5]
    )

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user_instruction}
    ]

def validate_pandas_expression(code: str) -> tuple[bool, str]:
    """Execute the validate_pandas_expression operation."""
    if not code or not code.strip():
        return True, ""
    try:
        tree = ast.parse(code, mode='exec')
    except SyntaxError as e:
        return False, f"Syntax error: {e}"

    for node in ast.walk(tree):
        node_type = type(node)
        if node_type not in ALLOWED_NODES:
            return False, f"Unsafe operation: {node_type.__name__}"
        if isinstance(node, ast.Name) and node.id in BLOCKED_NAMES:
            return False, f"Blocked identifier: {node.id}"
        if isinstance(node, ast.Attribute) and node.attr in BLOCKED_NAMES:
            return False, f"Blocked attribute: {node.attr}"

    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id != 'df':
                    return False, f"Cannot assign to '{target.id}'. Only 'df' allowed."

    return True, ""

def dry_run_mutation(
    df: pd.DataFrame,
    pandas_code: str,
    _affected_columns: list[str],
) -> tuple[list[dict], pd.DataFrame]:
    """Execute the dry_run_mutation operation."""
    df_original = df.copy()
    df_modified = df.copy()

    local_vars = {"df": df_modified, "pd": pd}
    exec(pandas_code, {"__builtins__": {}}, local_vars)
    df_modified = local_vars["df"]

    diff_rows = []
    # Check all columns in case new columns were added or existing ones were dropped
    all_cols = set(df_original.columns) | set(df_modified.columns)

    for col in all_cols:
        old_col = df_original.get(col, pd.Series([None] * len(df_original)))
        new_col = df_modified.get(col, pd.Series([None] * len(df_modified)))

        max_len = max(len(old_col), len(new_col))
        for idx in range(max_len):
            old_val = old_col.iloc[idx] if idx < len(old_col) else None
            new_val = new_col.iloc[idx] if idx < len(new_col) else None

            is_formula = isinstance(new_val, str) and new_val.startswith('=')

            # Handle NaN equality
            old_is_na = pd.isna(old_val)
            new_is_na = pd.isna(new_val)

            if (old_is_na != new_is_na) or (not old_is_na and old_val != new_val):
                diff_rows.append({
                    "rowIndex": idx,
                    "columnName": col,
                    "oldValue": None if old_is_na else old_val,
                    "newValue": None if new_is_na else new_val,
                    "isFormula": is_formula,
                })

    return diff_rows, df_modified
