"""Create the initial web database schema."""

import sqlalchemy as sa
from alembic import op

revision = "0001_initial_web_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create the tables used by sign-in and request middleware."""
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("google_id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("picture", sa.String()),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_table(
        "blocked_ips",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("ip_address", sa.String(), nullable=False),
        sa.Column("reason", sa.String()),
        sa.Column("blocked_until", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_blocked_ips_ip_address", "blocked_ips", ["ip_address"], unique=True)
    op.create_table(
        "api_logs",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("endpoint", sa.String(), nullable=False),
        sa.Column("method", sa.String(), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("processing_time_ms", sa.Float(), nullable=False),
        sa.Column("ip_address", sa.String()),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id")),
        sa.Column("user_agent", sa.String()),
        sa.Column("request_size_bytes", sa.Integer()),
        sa.Column("response_size_bytes", sa.Integer()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    """Remove the initial tables in foreign-key dependency order."""
    op.drop_table("api_logs")
    op.drop_table("blocked_ips")
    op.drop_table("users")
