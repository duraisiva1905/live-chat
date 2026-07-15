"""Pydantic schemas for Socket.IO payloads and API responses."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


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


class MessageOut(BaseModel):
    id: int | None = None
    username: str
    content: str
    message_type: Literal["user", "system"] = "user"
    room: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RoomUsersOut(BaseModel):
    room: str
    users: list[str]


class MessageHistoryOut(BaseModel):
    room: str
    messages: list[MessageOut]


class ErrorOut(BaseModel):
    message: str
    code: str | None = None


class HealthOut(BaseModel):
    status: str
    database: str
