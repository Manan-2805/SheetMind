"""The bounded data-only language for AI spreadsheet changes."""

from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    FiniteFloat,
    StrictBool,
    StrictInt,
    StrictStr,
    model_validator,
)

Scalar = StrictStr | StrictInt | FiniteFloat | StrictBool | None


class OperationModel(BaseModel):
    """Reject fields outside the operation schema."""

    model_config = ConfigDict(extra="forbid")


class ColumnValue(OperationModel):
    """Read the named column in the current row."""

    col: str


class ConstantValue(OperationModel):
    """Return the supplied literal without interpreting it as code."""

    const: Scalar


class ExpressionCall(OperationModel):
    """Apply one supported operator to its arguments."""

    op: Literal["add", "sub", "mul", "div", "upper", "lower", "strip", "title", "replace"]
    args: list["Expression"] = Field(min_length=1, max_length=3)

    @model_validator(mode="after")
    def check_arity(self) -> "ExpressionCall":
        """Validate the exact argument count for the operator."""
        expected = 1
        if self.op == "replace":
            expected = 3
        elif self.op in {"add", "sub", "mul", "div"}:
            expected = 2
        if len(self.args) != expected:
            raise ValueError(f"{self.op} requires {expected} arguments")
        return self


Expression = ColumnValue | ConstantValue | ExpressionCall
ExpressionCall.model_rebuild()


class RowFilter(OperationModel):
    """Compare one column against a scalar or test for a missing value."""

    column: str
    op: Literal[
        "eq",
        "ne",
        "lt",
        "lte",
        "gt",
        "gte",
        "contains",
        "startswith",
        "endswith",
        "isnull",
        "notnull",
    ]
    value: Scalar = None


class FilteredOperation(OperationModel):
    """An operation with optional conjunctive row filters."""

    filters: list[RowFilter] = Field(default_factory=list, max_length=20)


class SetValue(FilteredOperation):
    """Update values or fill only missing values in an existing column."""

    type: Literal["value_update", "value_fill"]
    column: str
    value: Expression


class DeleteRows(FilteredOperation):
    """Delete the rows matching the filters."""

    type: Literal["row_delete"]


class AddRows(OperationModel):
    """Append literal rows, filling unspecified columns with blanks."""

    type: Literal["row_add"]
    rows: list[dict[str, Scalar]] = Field(min_length=1, max_length=1000)


class AddColumn(FilteredOperation):
    """Append a new column with optional computed values."""

    type: Literal["column_add"]
    column: str = Field(min_length=1, max_length=255)
    value: Expression = Field(default_factory=lambda: ConstantValue(const=None))


class DeleteColumn(OperationModel):
    """Remove an existing column."""

    type: Literal["column_delete"]
    column: str


class InjectFormula(FilteredOperation):
    """Set explicit Excel formulas using the current worksheet row number."""

    type: Literal["formula_injection"]
    column: str
    template: str = Field(pattern=r"^=.*\{row\}", max_length=8192)


MutationOperation = Annotated[
    SetValue | DeleteRows | AddRows | AddColumn | DeleteColumn | InjectFormula,
    Field(discriminator="type"),
]
Operations = Annotated[list[MutationOperation], Field(max_length=20)]
OperationType = Literal[
    "value_update",
    "value_fill",
    "row_delete",
    "row_add",
    "column_add",
    "column_delete",
    "formula_injection",
]


class MutationPlan(OperationModel):
    """Validate the editing plan returned by the LLM."""

    operation_type: OperationType
    operations: Operations
    operation_summary: str
    confidence: int = Field(ge=1, le=5)
    affected_columns: list[str]
    followup_suggestions: list[str]
