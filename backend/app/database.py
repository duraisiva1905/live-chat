"""Async SQLAlchemy engine and session factory driven by DATABASE_URL."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from pathlib import Path
from urllib.parse import urlparse

from sqlalchemy import delete, text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings
from app.models import Base, UserSession


def _ensure_sqlite_directory(database_url: str) -> None:
    """Create the parent directory for a file-based SQLite database."""
    if not database_url.startswith("sqlite"):
        return

    parsed = urlparse(database_url)
    raw_path = parsed.path
    if database_url.startswith("sqlite+aiosqlite:////"):
        db_path = Path("/" + raw_path.lstrip("/"))
    else:
        db_path = Path(raw_path.lstrip("/"))

    if db_path.parent and str(db_path.parent) not in (".", ""):
        db_path.parent.mkdir(parents=True, exist_ok=True)


def _build_engine():
    database_url = settings.DATABASE_URL
    connect_args: dict = {}

    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        _ensure_sqlite_directory(database_url)

    return create_async_engine(
        database_url,
        echo=False,
        connect_args=connect_args,
    )


engine = _build_engine()
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session


async def _ensure_sqlite_room_columns(conn) -> None:
    """Add newer room columns when upgrading an existing SQLite schema."""
    if not settings.DATABASE_URL.startswith("sqlite"):
        return

    result = await conn.execute(text("PRAGMA table_info(rooms)"))
    columns = {row[1] for row in result.fetchall()}
    if not columns:
        return

    if "name_normalized" not in columns:
        await conn.execute(
            text("ALTER TABLE rooms ADD COLUMN name_normalized VARCHAR(100)")
        )
        await conn.execute(
            text(
                "UPDATE rooms SET name_normalized = lower(name) "
                "WHERE name_normalized IS NULL"
            )
        )
        await conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_rooms_name_normalized "
                "ON rooms (name_normalized)"
            )
        )

    if "created_by" not in columns:
        await conn.execute(
            text(
                "ALTER TABLE rooms ADD COLUMN created_by VARCHAR(50) "
                "NOT NULL DEFAULT 'unknown'"
            )
        )


async def init_db() -> None:
    """Create all tables if they do not exist and clear stale sessions."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _ensure_sqlite_room_columns(conn)
        await conn.execute(text("SELECT 1"))

    async with async_session_factory() as session:
        await session.execute(delete(UserSession))
        await session.commit()
