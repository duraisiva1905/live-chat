"""Socket.IO server and real-time event handlers."""

from __future__ import annotations

import logging
from typing import Any

import socketio
from pydantic import ValidationError

from app.config import settings
from app.database import async_session_factory
from app.models import Room
from app.room_manager import RoomError, room_manager
from app.schemas import CreateRoomPayload, JoinRoomPayload, SendMessagePayload

logger = logging.getLogger(__name__)

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=(
        "*"
        if "*" in settings.CORS_ORIGINS
        else settings.CORS_ORIGINS
    ),
    logger=False,
    engineio_logger=False,
)


async def _emit_error(sid: str, message: str, code: str | None = None) -> None:
    await sio.emit("error", {"message": message, "code": code}, to=sid)


async def _emit_room_list_updated() -> None:
    async with async_session_factory() as session:
        rooms = await room_manager.list_active_rooms(session)
    await sio.emit(
        "room_list_updated",
        {"rooms": [room.model_dump(mode="json") for room in rooms]},
    )


@sio.event
async def connect(sid: str, environ: dict[str, Any], auth: Any = None) -> bool:
    logger.info("Client connected: %s", sid)
    async with async_session_factory() as session:
        rooms = await room_manager.list_active_rooms(session)
    await sio.emit(
        "room_list_updated",
        {"rooms": [room.model_dump(mode="json") for room in rooms]},
        to=sid,
    )
    return True


@sio.event
async def disconnect(sid: str) -> None:
    logger.info("Client disconnected: %s", sid)
    async with async_session_factory() as session:
        result = await room_manager.leave(session, sid=sid)
        if result is None:
            return

        await sio.leave_room(sid, result.room_name)
        await sio.emit(
            "user_left",
            {"username": result.username, "room": result.room_name},
            room=result.room_name,
        )
        await sio.emit(
            "room_users",
            {
                "room": result.room_name,
                "users": [u.model_dump(mode="json") for u in result.users],
            },
            room=result.room_name,
        )
        await sio.emit(
            "new_message",
            result.leave_message.model_dump(mode="json"),
            room=result.room_name,
        )
    await _emit_room_list_updated()


@sio.event
async def create_room(sid: str, data: dict[str, Any]) -> None:
    try:
        payload = CreateRoomPayload.model_validate(data or {})
    except ValidationError as exc:
        await _emit_error(sid, exc.errors()[0]["msg"], code="validation_error")
        return

    try:
        async with async_session_factory() as session:
            room = await room_manager.create_room(
                session,
                payload.room_name,
                payload.created_by,
            )
    except RoomError as exc:
        await _emit_error(sid, exc.message, code=exc.code)
        return
    except Exception:
        logger.exception("Failed to create room")
        await _emit_error(sid, "Failed to create room", code="server_error")
        return

    await sio.emit("room_created", room.model_dump(mode="json"))
    await _emit_room_list_updated()


@sio.event
async def join_room(sid: str, data: dict[str, Any]) -> None:
    try:
        payload = JoinRoomPayload.model_validate(data or {})
    except ValidationError as exc:
        await _emit_error(sid, exc.errors()[0]["msg"], code="validation_error")
        return

    try:
        async with async_session_factory() as session:
            result = await room_manager.join(
                session,
                sid=sid,
                username=payload.username,
                room_name=payload.room,
            )
    except RoomError as exc:
        await _emit_error(sid, exc.message, code=exc.code)
        return
    except Exception:
        logger.exception("Failed to join room")
        await _emit_error(sid, "Failed to join room", code="server_error")
        return

    await sio.enter_room(sid, result.room_name)

    await sio.emit(
        "message_history",
        {
            "room": result.room_name,
            "created_by": result.created_by,
            "messages": [msg.model_dump(mode="json") for msg in result.history],
        },
        to=sid,
    )
    await sio.emit(
        "user_joined",
        {"username": result.username, "room": result.room_name},
        room=result.room_name,
    )
    await sio.emit(
        "room_users",
        {
            "room": result.room_name,
            "users": [u.model_dump(mode="json") for u in result.users],
        },
        room=result.room_name,
    )
    await sio.emit(
        "new_message",
        result.join_message.model_dump(mode="json"),
        room=result.room_name,
    )
    await _emit_room_list_updated()


@sio.event
async def send_message(sid: str, data: dict[str, Any]) -> None:
    try:
        payload = SendMessagePayload.model_validate(data or {})
    except ValidationError as exc:
        await _emit_error(sid, exc.errors()[0]["msg"], code="validation_error")
        return

    try:
        async with async_session_factory() as session:
            message = await room_manager.save_message(
                session,
                sid=sid,
                content=payload.content,
            )
    except RoomError as exc:
        await _emit_error(sid, exc.message, code=exc.code)
        return
    except Exception:
        logger.exception("Failed to send message")
        await _emit_error(sid, "Failed to send message", code="server_error")
        return

    await sio.emit(
        "new_message",
        message.model_dump(mode="json"),
        room=message.room,
    )


@sio.event
async def leave_room(sid: str, data: dict[str, Any] | None = None) -> None:
    async with async_session_factory() as session:
        result = await room_manager.leave(session, sid=sid)
        if result is None:
            return

    await sio.leave_room(sid, result.room_name)
    await sio.emit(
        "user_left",
        {"username": result.username, "room": result.room_name},
        room=result.room_name,
    )
    await sio.emit(
        "room_users",
        {
            "room": result.room_name,
            "users": [u.model_dump(mode="json") for u in result.users],
        },
        room=result.room_name,
    )
    await sio.emit(
        "new_message",
        result.leave_message.model_dump(mode="json"),
        room=result.room_name,
    )
    await _emit_room_list_updated()


@sio.event
async def typing(sid: str, data: dict[str, Any] | None = None) -> None:
    async with async_session_factory() as session:
        user_session = await room_manager.get_session(session, sid)
        if user_session is None:
            return
        room = await session.get(Room, user_session.room_id)
        if room is None:
            return
        username = user_session.username
        room_name = room.name

    await sio.emit(
        "typing",
        {"username": username, "room": room_name},
        room=room_name,
        skip_sid=sid,
    )


@sio.event
async def stop_typing(sid: str, data: dict[str, Any] | None = None) -> None:
    async with async_session_factory() as session:
        user_session = await room_manager.get_session(session, sid)
        if user_session is None:
            return
        room = await session.get(Room, user_session.room_id)
        if room is None:
            return
        username = user_session.username
        room_name = room.name

    await sio.emit(
        "stop_typing",
        {"username": username, "room": room_name},
        room=room_name,
        skip_sid=sid,
    )
