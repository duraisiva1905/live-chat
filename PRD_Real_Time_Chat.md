# Product Requirements Document

## Product
Real-Time Chat with Rooms

## Goal
Users join a named room and exchange live messages.

## User Flow
Landing -> Enter username -> Enter room -> Join -> Chat -> Leave

## Functional Requirements
- Username required
- Room required
- Auto-create room
- Live messaging
- Online users
- Join/leave notifications
- Timestamps

## Non-functional
- Responsive
- Modular
- Low latency
- Clean code

## Stack
Frontend:
- Next.js
- Tailwind
- Socket.IO Client

Backend:
- FastAPI
- python-socketio

## Socket Events
Client:
- join_room
- send_message
- leave_room

Server:
- new_message
- room_users
- user_joined
- user_left

## Acceptance Criteria
- Multiple users chat in same room.
- Room isolation.
- No page refresh.
- Clean responsive UI.
- Documented setup.

## Future
Redis, PostgreSQL, Auth, Docker, Kubernetes.
