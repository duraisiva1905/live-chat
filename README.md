# Live Chat — Real-Time Rooms

Production-style real-time chat with Next.js, FastAPI, Socket.IO, and SQLAlchemy.

Create rooms, browse active rooms live, join with a username, chat with typing indicators, and see online members. Messages persist so history is restored on rejoin.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), TypeScript (strict), Tailwind CSS, shadcn/ui, Socket.IO Client |
| Backend | FastAPI, python-socketio, Pydantic, Uvicorn |
| Database | SQLAlchemy 2 async — **SQLite by default**, Postgres-ready via `DATABASE_URL` |

## Features

- Explicit create room + join existing room (case-insensitive unique names)
- Live available-rooms list (name, online count, created time)
- Real-time messaging with Socket.IO
- Online users with initials avatars
- Typing indicators
- System join/leave messages
- HH:mm timestamps and smart auto-scroll
- Connection badge + toast notifications
- Responsive 3-column Slack/Discord-style UI
- REST: `GET /health`, `GET /rooms`, `GET /rooms/{room}/users`

## Project structure

```
live-chat/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── room_manager.py
│   │   └── socket_manager.py
│   ├── data/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   ├── components/chat/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   ├── Dockerfile
│   └── .env.local.example
└── docker-compose.yml
```

## Quick start (local)

### Prerequisites

- Python 3.12+
- Node.js 20+
- npm

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # optional; defaults work without it
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### Frontend

```bash
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create or select a room, enter a username, then chat. Use two browser windows to verify multi-user messaging.

## Docker Compose

```bash
docker compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8000/health](http://localhost:8000/health)

SQLite data is stored in the `chat_data` Docker volume.

## Environment variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./data/chat.db` | SQLAlchemy async URL |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins, or `*` |
| `MESSAGE_HISTORY_LIMIT` | `100` | Messages sent on join |

**Production database (Postgres example):**

```env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/livechat
```

Install the Postgres driver when switching engines:

```bash
pip install asyncpg
```

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:8000` | Backend Socket.IO / API base URL |

## REST API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness + database status |
| `GET` | `/rooms` | Active rooms (`room_id`, `room_name`, `created_at`, `active_users`) |
| `GET` | `/rooms/{room}/users` | Online users in a room |

## Socket.IO events

### Client → Server

| Event | Payload |
|-------|---------|
| `create_room` | `{ "room_name": string }` |
| `join_room` | `{ "username": string, "room": string }` |
| `send_message` | `{ "content": string }` |
| `leave_room` | `{}` |
| `typing` | `{}` |
| `stop_typing` | `{}` |

### Server → Client

| Event | Payload |
|-------|---------|
| `room_created` | `RoomSummary` |
| `room_list_updated` | `{ "rooms": RoomSummary[] }` |
| `message_history` | `{ "room": string, "messages": Message[] }` |
| `new_message` | `Message` |
| `room_users` | `{ "room": string, "users": User[] }` |
| `user_joined` / `user_left` | `{ "username": string, "room": string }` |
| `typing` / `stop_typing` | `{ "username": string, "room": string }` |
| `error` | `{ "message": string, "code"?: string }` |

`Message` shape:

```json
{
  "message_id": 1,
  "sender": "alex",
  "text": "Hello",
  "type": "chat",
  "room": "general",
  "timestamp": "2026-07-15T12:00:00+00:00"
}
```

## Database schema

- **rooms** — `id`, `name`, `name_normalized` (unique, case-insensitive), `created_at`
- **messages** — `id`, `room_id`, `username`, `content`, `message_type`, `created_at`
- **sessions** — active Socket.IO presence (`sid`, `username`, `room_id`, `joined_at`)

Active rooms are those with at least one online session. Empty rooms remain in the DB for history and uniqueness but are hidden from the live list.

## Smoke test (optional)

With the backend running:

```bash
cd backend
venv\Scripts\python scripts\e2e_socket_smoke.py
```

## License

Private / internal use unless otherwise stated.
