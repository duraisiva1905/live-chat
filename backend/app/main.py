"""FastAPI application entrypoint with Socket.IO ASGI mount."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import socketio
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import engine, get_session, init_db
from app.room_manager import room_manager
from app.schemas import HealthOut, RoomSummaryOut, UserOut, UsersIn, MessageOut
from app.socket_manager import sio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    logger.info("Initializing database (%s)",
                settings.DATABASE_URL.split("://")[0])
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


@fastapi_app.get("/rooms", response_model=list[RoomSummaryOut])
async def list_rooms(
    session: AsyncSession = Depends(get_session),
) -> list[RoomSummaryOut]:
    return await room_manager.list_active_rooms(session)


@fastapi_app.get("/rooms/{room_name}/users", response_model=list[UserOut])
async def list_room_users(
    room_name: str,
    session: AsyncSession = Depends(get_session),
) -> list[UserOut]:
    room = await room_manager.ensure_room_exists(session, room_name)
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return await room_manager.get_room_users(session, room_name)


@fastapi_app.get("/users", response_model=list[UserOut])
async def list_users(
    session: AsyncSession = Depends(get_session),
) -> list[UserOut]:
    return await room_manager.get_all_users(session)


@fastapi_app.get("/messages/{room_name}/{count}", response_model=list[MessageOut])
async def list_messages(
    room_name: str,
    count: int,
    session: AsyncSession = Depends(get_session),
) -> list[MessageOut]:
    print("Listing all messages")
    messages = await room_manager.get_all_messages(session, count, room_name)
    print(f"Messages: {messages}")
    return messages

socket_app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
app = socket_app
