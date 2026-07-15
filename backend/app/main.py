"""FastAPI application entrypoint with Socket.IO ASGI mount."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import engine, init_db
from app.schemas import HealthOut
from app.socket_manager import sio

import socketio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    logger.info("Initializing database (%s)", settings.DATABASE_URL.split("://")[0])
    await init_db()
    logger.info("Database ready")
    yield
    await engine.dispose()


fastapi_app = FastAPI(
    title="Live Chat API",
    version="1.0.0",
    lifespan=lifespan,
)

_cors_origins = settings.CORS_ORIGINS
_allow_all = "*" in _cors_origins

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _allow_all else _cors_origins,
    allow_credentials=not _allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)


@fastapi_app.get("/health", response_model=HealthOut)
async def health() -> HealthOut:
    db_status = "ok"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Database health check failed")
        db_status = "error"

    status = "ok" if db_status == "ok" else "degraded"
    return HealthOut(status=status, database=db_status)


# Socket.IO wraps FastAPI so both HTTP and WebSocket share one ASGI app.
socket_app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

# Alias used by uvicorn: `uvicorn app.main:app`
app = socket_app
