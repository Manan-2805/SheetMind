import logging
from collections.abc import Generator

import sqlalchemy
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_database_if_not_exists() -> None:
    default_url = (
        f"postgresql+psycopg2://{settings.postgres_user}:{settings.postgres_password}"
        f"@{settings.postgres_host}:{settings.postgres_port}/postgres"
    )
    default_engine = create_engine(default_url, isolation_level="AUTOCOMMIT")

    try:
        with default_engine.connect() as conn:
            result = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :dbname"),
                {"dbname": settings.postgres_db},
            )
            if not result.fetchone():
                conn.execute(text(f'CREATE DATABASE "{settings.postgres_db}"'))
                logger.info("Database '%s' created successfully.", settings.postgres_db)
            else:
                logger.info("Database '%s' already exists.", settings.postgres_db)
    except sqlalchemy.exc.OperationalError:
        logger.warning(
            "Could not connect to default 'postgres' database to check/create '%s'. "
            "Assuming database already exists.",
            settings.postgres_db,
        )
    finally:
        default_engine.dispose()
