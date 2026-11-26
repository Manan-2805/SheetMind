"""Check the structured Excel editing language independently of any real LLM."""

from pathlib import Path
from unittest import TestCase

import pandas as pd
from pydantic import TypeAdapter, ValidationError

from schemas.excel_operations import MutationOperation
from services.excel_mutation_service import dry_run_mutation


class ExcelOperationsTests(TestCase):
    """Exercise every supported operation and reject unknown input."""

    def setUp(self):
        self.frame = pd.DataFrame(
            [[" a ", 4, None], ["B", 2, "kept"]], columns=["name", "num", "note"], dtype=object
        )
        self.adapter = TypeAdapter(list[MutationOperation])

    def apply(self, **operation):
        """Parse an operation and return the modified frame."""
        _, frame = dry_run_mutation(self.frame, self.adapter.validate_python([operation]))
        return frame

    def test_value_update(self):
        result = self.apply(
            type="value_update",
            column="num",
            filters=[{"column": "name", "op": "contains", "value": "a"}],
            value={"op": "mul", "args": [{"col": "num"}, {"const": 3}]},
        )
        self.assertEqual(result.num.tolist(), [12, 2])

    def test_value_fill(self):
        result = self.apply(type="value_fill", column="note", value={"const": "__globals__"})
        self.assertEqual(result.note.tolist(), ["__globals__", "kept"])

    def test_row_delete(self):
        result = self.apply(type="row_delete", filters=[{"column": "num", "op": "gte", "value": 4}])
        self.assertEqual(result.index.tolist(), [1])

    def test_row_add(self):
        result = self.apply(type="row_add", rows=[{"name": "new", "num": 1}])
        self.assertEqual(result.loc[2].tolist(), ["new", 1, None])

    def test_column_add(self):
        result = self.apply(
            type="column_add",
            column="upper",
            value={"op": "upper", "args": [{"op": "strip", "args": [{"col": "name"}]}]},
        )
        self.assertEqual(result.upper.tolist(), ["A", "B"])

    def test_column_delete(self):
        result = self.apply(type="column_delete", column="name")
        self.assertEqual(result.columns.tolist(), ["num", "note"])

    def test_formula_injection(self):
        operation = {"type": "formula_injection", "column": "num", "template": "=A{row}"}
        diff, result = dry_run_mutation(self.frame, self.adapter.validate_python([operation]))
        self.assertEqual(result.num.tolist(), ["=A2", "=A3"])
        self.assertTrue(all(row["isFormula"] for row in diff))

    def test_unknown_columns_and_bad_expression(self):
        with self.assertRaisesRegex(ValueError, "Unknown column"):
            self.apply(type="value_update", column="num", value={"col": "unknown"})
        with self.assertRaises(ValidationError):
            self.apply(type="value_update", column="num", value={"op": "__globals__", "args": []})
        with self.assertRaises(ValidationError):
            self.apply(type="formula_injection", column="num", template="A{row}")

    def test_backend_has_no_dynamic_python_execution(self):
        root = Path(__file__).resolve().parents[1]
        for path in root.rglob("*.py"):
            relative = path.relative_to(root)
            if relative.parts[0] in {".venv", "tests"}:
                continue
            with self.subTest(path=relative):
                source = path.read_text(encoding="utf-8")
                self.assertNotRegex(source, r"\b(?:exec|eval)\s*\(")
