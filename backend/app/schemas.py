"""Pydantic schemas for Socket.IO payloads and API responses."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class CreateRoomPayload(BaseModel):
    room_name: str = Field(..., min_length=1, max_length=100)

    @field_validator("room_name", mode="before")
    @classmethod
    def normalize_room_name(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class JoinRoomPayload(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    room: str = Field(..., min_length=1, max_length=100)

    @field_validator("username", "room", mode="before")
    @classmethod
    def normalize_text(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class SendMessagePayload(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)

    @field_validator("content", mode="before")
    @classmethod
    def normalize_content(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class TypingPayload(BaseModel):
    room: str | None = None


class UserOut(BaseModel):
    username: str
    socket_id: str
    joined_at: datetime


class MessageOut(BaseModel):
    """Wire format aligned with the structured Message contract."""

    message_id: int | None = None
    sender: str
    text: str
    timestamp: datetime
    type: Literal["chat", "system"] = "chat"
    room: str

    model_config = {"from_attributes": True}


class RoomSummaryOut(BaseModel):
    room_id: int
    room_name: str
    created_at: datetime
    active_users: int


class RoomUsersOut(BaseModel):
    room: str
    users: list[UserOut]


class MessageHistoryOut(BaseModel):
    room: str
    messages: list[MessageOut]


class RoomListOut(BaseModel):
    rooms: list[RoomSummaryOut]


class ErrorOut(BaseModel):
    message: str
    code: str | None = None


class HealthOut(BaseModel):
    status: str
    database: str
