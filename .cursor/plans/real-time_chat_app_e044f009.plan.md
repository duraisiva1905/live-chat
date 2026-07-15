---
name: Real-Time Chat App
overview: Build a production-quality real-time chat app (Next.js 16 + FastAPI + Socket.IO) with SQLAlchemy persistence defaulting to SQLite via DATABASE_URL, so Postgres (or another DB) can be plugged in for production without code changes.
todos:
  - id: backend-core
    content: "Scaffold backend/app: DATABASE_URL + SQLAlchemy async layer, models, schemas, room_manager, socket_manager, main + /health"
    status: completed
  - id: frontend-primitives
    content: Add shadcn UI pieces, types, socket client, env example; verify build
    status: completed
  - id: frontend-chat
    content: Implement useSocket/useChat and Slack-like join + chat UI with all states (incl. history load)
    status: completed
  - id: socket-e2e
    content: Wire events end-to-end; verify multi-user, room isolation, reconnect, message persistence
    status: completed
  - id: docker-readme
    content: Add Dockerfiles, docker-compose.yml (SQLite volume + DATABASE_URL), and production README
    status: completed
  - id: review-refactor
    content: "Code review pass: duplication, errors, a11y, remove boilerplate"
    status: completed
isProject: false
---

# Real-Time Chat Application Plan

## Current state

| Area | Status |
|------|--------|
| Backend | [`requirements.txt`](backend/requirements.txt) + venv only — **no app code** |
| Frontend | Next.js 16 + Tailwind 4 + shadcn scaffold — **stock welcome page**, `socket.io-client` unused |
| Docs / Docker | Root README is a stub; no Compose |

**Stack note:** Spec cites Next.js 15; the scaffold is already **Next.js 16.2**. Keep 16 (do not downgrade). Persistence uses **SQLAlchemy 2.0 async** with **SQLite** locally and a **`DATABASE_URL`** env placeholder for Postgres (or other engines) in production.

## Architecture

```mermaid
flowchart LR
  subgraph frontend [Frontend Next.js]
    JoinForm[JoinForm]
    ChatRoom[ChatRoom]
    useSocket[useSocket hook]
    JoinForm --> ChatRoom
    ChatRoom --> useSocket
  end
  subgraph backend [Backend FastAPI]
    Main[main.py ASGI]
    SocketMgr[socket_manager]
    RoomMgr[room_manager]
    Schemas[schemas Pydantic]
    DBLayer[database.py]
    DB[(DATABASE_URL)]
    Main --> SocketMgr
    SocketMgr --> RoomMgr
    SocketMgr --> Schemas
    RoomMgr --> DBLayer
    DBLayer --> DB
  end
  useSocket -->|"Socket.IO"| SocketMgr
```

**Socket events (exact PRD contract):**

| Client → Server | Server → Client |
|-----------------|-----------------|
| `join_room` | `new_message` |
| `send_message` | `room_users` |
| `leave_room` | `user_joined` / `user_left` |

Plus:
- Server `error` event for validation/join failures
- On successful join, server emits `message_history` (joining client only) with recent persisted messages for that room

### Database strategy

- **Config:** single env var `DATABASE_URL` (placeholder for production).
- **Local default:** `sqlite+aiosqlite:///./data/chat.db` when `DATABASE_URL` is unset.
- **Production swap:** set e.g. `DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/livechat` — no application logic changes; only engine URL (+ driver package).
- **ORM:** dialect-agnostic SQLAlchemy models (portable types: `String`, `Integer`, `DateTime(timezone=True)`, FKs). Avoid SQLite-only SQL.
- **Deps now:** `sqlalchemy`, `aiosqlite`.
- **Deps documented for later:** `asyncpg` (Postgres) — listed in README / optional comment in requirements, not required for local SQLite runs.
- **Bootstrap:** `init_db()` creates tables on startup (`create_all`). Alembic migrations deferred (out of MVP scope); README notes them for production Postgres.

**What is persisted:** rooms, chat messages, active socket sessions (for online users). Message history survives restarts. Empty rooms are kept so history remains queryable.

---

## Target folder structure

```
backend/
  app/
    __init__.py
    main.py              # FastAPI + Socket.IO ASGI mount, /health, startup DB init
    config.py            # settings: DATABASE_URL (default SQLite), CORS, history limit
    database.py          # async engine from DATABASE_URL, session factory, init_db()
    models.py            # SQLAlchemy ORM (Room, Message, Session)
    schemas.py           # Pydantic request/payload validation
    room_manager.py      # room membership + message persistence via DB
    socket_manager.py    # AsyncServer, event handlers
  data/                  # local SQLite file dir (gitignored)
  .env.example           # DATABASE_URL=sqlite+aiosqlite:///./data/chat.db
  Dockerfile
  requirements.txt       # + sqlalchemy, aiosqlite

frontend/
  app/
    layout.tsx
    page.tsx
    globals.css
  components/
    chat/
      JoinForm.tsx
      ChatLayout.tsx
      MessageList.tsx
      MessageItem.tsx
      MessageInput.tsx
      OnlineUsers.tsx
      ConnectionStatus.tsx
      EmptyState.tsx
    ui/                  # shadcn primitives
  hooks/
    useSocket.ts
    useChat.ts
  lib/
    socket.ts
    utils.ts
  types/
    chat.ts

docker-compose.yml       # DATABASE_URL + volume for SQLite data
README.md
.gitignore
```

---

## Phase 1 — Backend (+ DATABASE_URL / SQLite)

Implement under [`backend/app/`](backend/app/). Add `sqlalchemy` and `aiosqlite` to [`backend/requirements.txt`](backend/requirements.txt).

1. **`config.py`** — Read `DATABASE_URL` from env; default `sqlite+aiosqlite:///./data/chat.db`. Also CORS origins, `MESSAGE_HISTORY_LIMIT` (e.g. 100). Document Postgres example URL in comments / `.env.example`.
2. **`database.py`** — Create async engine from `settings.DATABASE_URL`. For SQLite URLs only, set `connect_args={"check_same_thread": False}` and ensure parent dir of the DB file exists. Expose `async_sessionmaker`, `get_session()`, `init_db()` (`Base.metadata.create_all`).
3. **`models.py`** — Portable ORM tables:
   - `rooms` — `id`, `name` (unique), `created_at`
   - `messages` — `id`, `room_id` FK, `username`, `content`, `message_type` (`user` | `system`), `created_at`; index on `(room_id, created_at)`
   - `sessions` — `sid` PK, `username`, `room_id` FK, `joined_at`
4. **`schemas.py`** — Pydantic: `JoinRoomPayload`, `SendMessagePayload`, `LeaveRoomPayload`, outbound DTOs, `MessageHistoryPayload`.
5. **`room_manager.py`** — Async DB service:
   - `join` → upsert room; reject duplicate **active** username in same room; insert session; return recent messages
   - `leave` → delete session; keep room/history
   - `save_message`, `get_users`, `get_session`, `get_recent_messages`
6. **`socket_manager.py`** — PRD events; on join emit `message_history` then `user_joined` / `room_users` / system `new_message`; persist on `send_message`; disconnect → leave + notify.
7. **`main.py`** — Lifespan `init_db()`; `GET /health` (optionally include `"database": "ok"`); ASGI Socket.IO wrap; port **8000**.

Verify: server starts with default SQLite URL, `/health` OK, `data/chat.db` created. Confirm changing `DATABASE_URL` is the only switch needed for a different engine (Postgres wiring documented, not required to run locally).

---

## Phase 2 — Frontend scaffold + UI primitives

Keep existing Next 16 / Tailwind 4 / shadcn setup.

1. Add shadcn: `input`, `label`, `scroll-area`, `separator`, `avatar`, `badge` (reuse existing button).
2. [`types/chat.ts`](frontend/types/chat.ts) — include `message_history` payload type.
3. [`lib/socket.ts`](frontend/lib/socket.ts) — `io(NEXT_PUBLIC_SOCKET_URL, { autoConnect: false, reconnection: true })`.
4. `.env.local.example` with `NEXT_PUBLIC_SOCKET_URL=http://localhost:8000`.
5. Update layout metadata + globals for dark Slack/Discord chat shell.

Verify: `npm run build`.

---

## Phase 3 — Socket hooks + chat UI

1. **`useSocket` / `useChat`** — On join success, seed messages from `message_history`; append live `new_message`. Loading/error/empty states.
2. Chat components: JoinForm, ChatLayout, MessageList/Item, MessageInput, OnlineUsers, ConnectionStatus, EmptyState.
3. **`app/page.tsx`** — JoinForm until joined, then ChatLayout.

Verify: build + two-browser E2E, including **rejoin same room sees prior messages** after refresh/restart.

---

## Phase 4 — Docker + README

1. Backend Dockerfile (Python 3.12); writable `/app/data`.
2. Frontend multi-stage Dockerfile with `NEXT_PUBLIC_SOCKET_URL` build arg.
3. **`docker-compose.yml`** — backend + frontend; mount volume for SQLite; set:
   - `DATABASE_URL=sqlite+aiosqlite:///./data/chat.db` (default local/container)
   - Comment or README section showing Postgres override example (no Postgres service in Compose for MVP unless needed later)
4. README — local setup, env vars:
   - `DATABASE_URL` (required placeholder; default SQLite documented)
   - Example Postgres URL for production
   - Note to install `asyncpg` when using Postgres
   - `NEXT_PUBLIC_SOCKET_URL`, socket events, schema overview
5. Root `.gitignore` — `venv/`, `node_modules/`, `__pycache__/`, `*.db`, `backend/data/`, `.env*`.
6. [`backend/.env.example`](backend/.env.example):

```env
# Local (default if unset)
DATABASE_URL=sqlite+aiosqlite:///./data/chat.db

# Production example (Postgres)
# DATABASE_URL=postgresql+asyncpg://user:password@host:5432/livechat
```

---

## Phase 5 — Hardening + review

- Pydantic validation + client error UI
- Idempotent leave; disconnect cleans `sessions` row
- Duplicate active username in room → error, stay on join form
- Accessibility + no placeholder/TODO code
- DB access isolated in `database.py` + `room_manager.py` (easy engine swap via URL only)
- Commits only when you request them

## Acceptance criteria mapping

- Multiple users in same room, live messages — Socket.IO + persisted `messages`
- Room isolation — rooms table + Socket.IO rooms
- Message persistence — SQLite by default via `DATABASE_URL`; history on join
- Production-ready DB swap — change `DATABASE_URL` (+ driver) to Postgres or other SQLAlchemy-supported DB
- No page refresh required for live chat — client SPA on `/`
- Responsive Slack-like UI
- Health endpoint + Docker Compose + documented setup
