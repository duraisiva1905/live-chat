# Product Requirements Document

## Product
Live Chat — Real-Time Rooms

## Goal
Users create or join named chat rooms and exchange live messages with presence, typing indicators, and persistent history—without page refreshes.

## User Flows

### Landing (not joined)
1. Open app → connect to lobby (live room list)
2. Select an existing room **or** create a new room (name + creator)
3. Enter username → Join room → enter chat

### Chat (joined)
1. View message history and send messages
2. See online users, typing indicators, and connection status
3. Leave room (with confirmation) → return to landing

## Functional Requirements

### Rooms
- Explicit **create room** (join never auto-creates)
- Case-insensitive unique room names
- Creator attribution (`created_by`) stored and shown in UI
- Live room list with name, online count, creator, and created time
- Select a room card to prefill the join form
- Empty / inactive rooms remain in the DB for history and uniqueness; list may show rooms with `0 online`

### Join / leave
- Username required (1–50 chars, trimmed)
- Room required (1–100 chars, trimmed)
- Username unique per room while online
- Same socket cannot join the same room twice (`already_joined`)
- Join of a missing room returns `room_not_found` (UI offers create)
- Leave room explicitly; disconnect also cleans up presence
- System join/leave messages persisted and shown in the timeline

### Messaging
- Live messaging via Socket.IO (room-isolated)
- Message history restored on join (default last 100; configurable)
- Chat messages and system messages with timestamps (`HH:mm`, 24-hour)
- Message length 1–2000 characters
- Smart auto-scroll (only when user is near bottom)

### Presence & typing
- Online users list with initials avatars; highlight current user
- Typing indicators (`X is typing…` / multi-user compact form)
- Typing is ephemeral (not persisted); stop after idle debounce (~2s)

### Connection & feedback
- Connection badge: Connected / Reconnecting / Disconnected
- Toast notifications for connect, reconnect, disconnect, errors, and room created
- Inline errors with structured codes; create success banner on landing
- Pending create/join retried after reconnect when mid-flow

### Layout & UX
- Landing: room list + join/create dual-mode form
- Joined: responsive 3-column layout (Rooms | Chat | Online Users)
- Mobile: slide-over drawers for room and user sidebars
- Empty states for rooms, messages, and online users
- Leave confirmation dialog

## Non-functional
- Responsive (desktop + mobile)
- Modular frontend/backend structure
- Low-latency Socket.IO (websocket + polling fallback)
- Messages and rooms persist across restarts
- Clean, typed codebase; documented setup
- Postgres-ready via `DATABASE_URL`; SQLite by default

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Socket.IO Client, Sonner |
| Backend | FastAPI, python-socketio, Pydantic, Uvicorn |
| Database | SQLAlchemy 2 async — SQLite default, Postgres via `DATABASE_URL` |
| Ops | Docker Compose (optional) |

## REST API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness + database status |
| `GET` | `/rooms` | Room list (`room_id`, `room_name`, `created_at`, `created_by`, `active_users`) |
| `GET` | `/rooms/{room}/users` | Online users in a room |

## Socket Events

### Client → Server
| Event | Payload |
|-------|---------|
| `create_room` | `{ room_name, created_by }` |
| `join_room` | `{ username, room }` |
| `send_message` | `{ content }` |
| `leave_room` | `{}` |
| `typing` | `{}` |
| `stop_typing` | `{}` |

### Server → Client
| Event | Payload |
|-------|---------|
| `room_created` | `RoomSummary` |
| `room_list_updated` | `{ rooms: RoomSummary[] }` |
| `message_history` | `{ room, created_by, messages }` |
| `new_message` | `Message` |
| `room_users` | `{ room, users }` |
| `user_joined` / `user_left` | `{ username, room }` |
| `typing` / `stop_typing` | `{ username, room }` |
| `error` | `{ message, code? }` |

Connection status is **client-derived** from Socket.IO lifecycle (not a server event).

## Error Codes
| Code | Meaning |
|------|---------|
| `validation_error` | Invalid or missing fields |
| `room_exists` | Duplicate room name (case-insensitive) |
| `room_not_found` | Join target does not exist |
| `already_joined` | Socket already in that room |
| `username_taken` | Username already online in room |
| `not_in_room` | Action requires an active room session |
| `server_error` | Unexpected server failure |

## Data Model
- **rooms** — `id`, `name`, `name_normalized` (unique), `created_by`, `created_at`
- **messages** — `id`, `room_id`, `username`, `content`, `message_type` (`user` \| `system`), `created_at`
- **sessions** — live presence (`sid`, `username`, `room_id`, `joined_at`); purged on server startup

## Acceptance Criteria
- [x] Multiple users chat in the same room without page refresh
- [x] Rooms are isolated (messages only within room)
- [x] Rooms are created explicitly; join does not auto-create
- [x] Room names are unique case-insensitively
- [x] Live room list updates as users join/leave
- [x] Online users and typing indicators work per room
- [x] Message history restores on rejoin
- [x] System join/leave messages appear in the timeline
- [x] Connection badge and toasts reflect connectivity
- [x] Responsive 3-column / mobile drawer UI
- [x] Documented local and Docker setup

## Out of Scope / Future
- Authentication / authorization
- Private or password-protected rooms
- Redis-backed presence or multi-instance scaling
- Room rename / delete admin UI
- Direct messages, threads, reactions, file uploads
- Message edit/delete, read receipts, unread counts
- Alembic-managed migrations
- Kubernetes
