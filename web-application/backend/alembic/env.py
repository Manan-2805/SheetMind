from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool, text

from app.config import settings
from app.database import Base
from app.models import ApiLog, BlockedIP, User  # noqa: F401

config = context.config

if config.config_file_name is not None and config.attributes.get("configure_logging", True):
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
MIGRATION_LOCK_ID = 0x53484545544D494E


def run_migrations_online() -> None:
    """Serialize schema upgrades across backend workers and manual runs."""
    connectable = create_engine(settings.database_url, poolclass=pool.NullPool)

    with connectable.begin() as connection:
        connection.execute(
            text("SELECT pg_advisory_xact_lock(:lock_id)"),
            {"lock_id": MIGRATION_LOCK_ID},
        )
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


run_migrations_online()
