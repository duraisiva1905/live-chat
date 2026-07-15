"""Room membership and message persistence service."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Message, Room, UserSession
from app.schemas import MessageOut, RoomSummaryOut, UserOut


class RoomError(Exception):
    """Domain error raised for invalid room operations."""

    def __init__(self, message: str, code: str = "room_error") -> None:
        super().__init__(message)
        self.message = message
        self.code = code


@dataclass(frozen=True)
class JoinResult:
    room_name: str
    room_id: int
    username: str
    users: list[UserOut]
    history: list[MessageOut]
    join_message: MessageOut


@dataclass(frozen=True)
class LeaveResult:
    room_name: str
    username: str
    users: list[UserOut]
    leave_message: MessageOut
    became_inactive: bool


class RoomManager:
    """Coordinates rooms, sessions, and messages through the database."""

    @staticmethod
    def normalize_room_key(room_name: str) -> str:
        return room_name.strip().lower()

    async def create_room(self, session: AsyncSession, room_name: str) -> RoomSummaryOut:
        cleaned = room_name.strip()
        if not cleaned:
            raise RoomError("Room name is required", code="validation_error")

        normalized = self.normalize_room_key(cleaned)
        existing = await session.scalar(
            select(Room).where(Room.name_normalized == normalized)
        )
        if existing is not None:
            raise RoomError(
                f"Room '{existing.name}' already exists",
                code="room_exists",
            )

        room = Room(name=cleaned, name_normalized=normalized)
        session.add(room)
        await session.commit()
        await session.refresh(room)
        return RoomSummaryOut(
            room_id=room.id,
            room_name=room.name,
            created_at=room.created_at,
            active_users=0,
        )

    async def join(
        self,
        session: AsyncSession,
        *,
        sid: str,
        username: str,
        room_name: str,
    ) -> JoinResult:
        room = await self._get_room_by_name(session, room_name)
        if room is None:
            raise RoomError(
                f"Room '{room_name}' does not exist. Create it first.",
                code="room_not_found",
            )

        existing_session = await session.get(UserSession, sid)
        if existing_session is not None:
            if existing_session.room_id == room.id:
                raise RoomError(
                    "You are already in this room",
                    code="already_joined",
                )
            await session.delete(existing_session)
            await session.flush()

        duplicate = await session.scalar(
            select(UserSession).where(
                UserSession.room_id == room.id,
                UserSession.username == username,
            )
        )
        if duplicate is not None:
            raise RoomError(
                f"Username '{username}' is already in use in this room",
                code="username_taken",
            )

        user_session = UserSession(sid=sid, username=username, room_id=room.id)
        session.add(user_session)
        await session.flush()

        history = await self.get_recent_messages(session, room.name)

        join_msg = Message(
            room_id=room.id,
            username="system",
            content=f"{username} joined the room",
            message_type="system",
        )
        session.add(join_msg)
        await session.commit()
        await session.refresh(join_msg)

        users = await self.get_room_users(session, room.name)

        return JoinResult(
            room_name=room.name,
            room_id=room.id,
            username=username,
            users=users,
            history=history,
            join_message=self._to_message_out(join_msg, room.name),
        )

    async def leave(
        self,
        session: AsyncSession,
        *,
        sid: str,
    ) -> LeaveResult | None:
        """Remove a session. Returns LeaveResult or None if not in a room."""
        user_session = await session.get(UserSession, sid)
        if user_session is None:
            return None

        room = await session.get(Room, user_session.room_id)
        if room is None:
            await session.delete(user_session)
            await session.commit()
            return None

        username = user_session.username
        room_name = room.name

        await session.delete(user_session)

        leave_msg = Message(
            room_id=room.id,
            username="system",
            content=f"{username} left the room",
            message_type="system",
        )
        session.add(leave_msg)
        await session.commit()
        await session.refresh(leave_msg)

        users = await self.get_room_users(session, room_name)
        return LeaveResult(
            room_name=room_name,
            username=username,
            users=users,
            leave_message=self._to_message_out(leave_msg, room_name),
            became_inactive=len(users) == 0,
        )

    async def save_message(
        self,
        session: AsyncSession,
        *,
        sid: str,
        content: str,
    ) -> MessageOut:
        user_session = await session.get(UserSession, sid)
        if user_session is None:
            raise RoomError("You must join a room before sending messages", code="not_in_room")

        room = await session.get(Room, user_session.room_id)
        if room is None:
            raise RoomError("Room not found", code="room_not_found")

        message = Message(
            room_id=room.id,
            username=user_session.username,
            content=content,
            message_type="user",
        )
        session.add(message)
        await session.commit()
        await session.refresh(message)
        return self._to_message_out(message, room.name)

    async def list_active_rooms(self, session: AsyncSession) -> list[RoomSummaryOut]:
        stmt = (
            select(
                Room.id,
                Room.name,
                Room.created_at,
                func.count(UserSession.sid).label("active_users"),
            )
            .join(UserSession, UserSession.room_id == Room.id)
            .group_by(Room.id, Room.name, Room.created_at)
            .order_by(Room.name.asc())
        )
        rows = (await session.execute(stmt)).all()
        return [
            RoomSummaryOut(
                room_id=row.id,
                room_name=row.name,
                created_at=row.created_at,
                active_users=int(row.active_users),
            )
            for row in rows
        ]

    async def get_room_users(self, session: AsyncSession, room_name: str) -> list[UserOut]:
        room = await self._get_room_by_name(session, room_name)
        if room is None:
            return []

        result = await session.scalars(
            select(UserSession)
            .where(UserSession.room_id == room.id)
            .order_by(UserSession.joined_at.asc())
        )
        return [
            UserOut(
                username=user.username,
                socket_id=user.sid,
                joined_at=user.joined_at,
            )
            for user in result.all()
        ]

    async def get_session(
        self,
        session: AsyncSession,
        sid: str,
    ) -> UserSession | None:
        return await session.get(UserSession, sid)

    async def get_recent_messages(
        self,
        session: AsyncSession,
        room_name: str,
        limit: int | None = None,
    ) -> list[MessageOut]:
        limit = limit or settings.MESSAGE_HISTORY_LIMIT
        room = await self._get_room_by_name(session, room_name)
        if room is None:
            return []

        result = await session.scalars(
            select(Message)
            .where(Message.room_id == room.id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        messages = list(reversed(result.all()))
        return [self._to_message_out(msg, room.name) for msg in messages]

    async def ensure_room_exists(self, session: AsyncSession, room_name: str) -> Room | None:
        return await self._get_room_by_name(session, room_name)

    async def _get_room_by_name(self, session: AsyncSession, room_name: str) -> Room | None:
        normalized = self.normalize_room_key(room_name)
        return await session.scalar(
            select(Room).where(Room.name_normalized == normalized)
        )

    @staticmethod
    def _to_message_out(message: Message, room_name: str) -> MessageOut:
        raw_type = message.message_type
        msg_type: Literal["chat", "system"] = (
            "system" if raw_type == "system" else "chat"
        )
        return MessageOut(
            message_id=message.id,
            sender=message.username if msg_type == "chat" else "system",
            text=message.content,
            timestamp=message.created_at,
            type=msg_type,
            room=room_name,
        )


room_manager = RoomManager()
