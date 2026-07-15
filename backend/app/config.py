"""Application configuration loaded from environment variables."""

from __future__ import annotations

import os


class Settings:
    """Runtime settings with sensible local defaults.

    DATABASE_URL is the single switch for persistence engines.
    Local default uses SQLite; for production set a Postgres URL, e.g.:
    DATABASE_URL=postgresql+asyncpg://user:password@host:5432/livechat
    (install asyncpg when using Postgres).
    """

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./data/chat.db",
    )
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            # '*' enables Socket.IO from any origin (dev/Docker-friendly).
            # Restrict in production, e.g. https://chat.example.com
            "*",
        ).split(",")
        if origin.strip()
    ]
    MESSAGE_HISTORY_LIMIT: int = int(os.getenv("MESSAGE_HISTORY_LIMIT", "100"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))


settings = Settings()
