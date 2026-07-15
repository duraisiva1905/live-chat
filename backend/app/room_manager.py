"""Room membership and message persistence service."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Message, Room, UserSession
from app.schemas import MessageOut


class RoomError(Exception):
    """Domain error raised for invalid room operations."""

    def __init__(self, message: str, code: str = "room_error") -> None:
        super().__init__(message)
        self.message = message
        self.code = code


@dataclass(frozen=True)
class JoinResult:
    room_name: str
    username: str
    users: list[str]
    history: list[MessageOut]
    join_message: MessageOut


class RoomManager:
    """Coordinates rooms, sessions, and messages through the database."""

    async def join(
        self,
        session: AsyncSession,
        *,
        sid: str,
        username: str,
        room_name: str,
    ) -> JoinResult:
        room = await self._get_or_create_room(session, room_name)

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

        existing_session = await session.get(UserSession, sid)
        if existing_session is not None:
            await session.delete(existing_session)
            await session.flush()

        user_session = UserSession(sid=sid, username=username, room_id=room.id)
        session.add(user_session)
        await session.flush()

        # Load prior history before appending the join system message
        # so the joiner does not receive that message twice.
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

        users = await self.get_users(session, room.name)

        return JoinResult(
            room_name=room.name,
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
    ) -> tuple[str, str, list[str], MessageOut] | None:
        """Remove a session. Returns (room, username, remaining_users, leave_message) or None."""
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

        users = await self.get_users(session, room_name)
        return (
            room_name,
            username,
            users,
            self._to_message_out(leave_msg, room_name),
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

    async def get_users(self, session: AsyncSession, room_name: str) -> list[str]:
        room = await session.scalar(select(Room).where(Room.name == room_name))
        if room is None:
            return []

        result = await session.scalars(
            select(UserSession.username)
            .where(UserSession.room_id == room.id)
            .order_by(UserSession.joined_at.asc())
        )
        return list(result.all())

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
        room = await session.scalar(select(Room).where(Room.name == room_name))
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

    async def _get_or_create_room(self, session: AsyncSession, room_name: str) -> Room:
        room = await session.scalar(select(Room).where(Room.name == room_name))
        if room is not None:
            return room

        room = Room(name=room_name)
        session.add(room)
        await session.flush()
        return room

    @staticmethod
    def _to_message_out(message: Message, room_name: str) -> MessageOut:
        return MessageOut(
            id=message.id,
            username=message.username,
            content=message.content,
            message_type=message.message_type if message.message_type in ("user", "system") else "user",
            room=room_name,
            created_at=message.created_at,
        )


room_manager = RoomManager()
