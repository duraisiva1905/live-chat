# Live Chat — Real-Time Rooms

Production-style real-time chat with Next.js, FastAPI, Socket.IO, and SQLAlchemy.

Users join a named room, chat live, see online members, and receive join/leave system messages. Messages persist in a database so history is restored on rejoin.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), TypeScript (strict), Tailwind CSS, shadcn/ui, Socket.IO Client |
| Backend | FastAPI, python-socketio, Pydantic, Uvicorn |
| Database | SQLAlchemy 2 async — **SQLite by default**, Postgres-ready via `DATABASE_URL` |

## Features

- Join by username + room name (rooms auto-create)
- Real-time messaging with Socket.IO
- Online users sidebar
- System join/leave messages
- Message timestamps and auto-scroll
- Persisted message history
- Connection / loading / empty / error states
- Responsive, accessible Slack/Discord-style UI
- `GET /health` endpoint

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
│   ├── data/                 # SQLite file (gitignored)
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

Open [http://localhost:3000](http://localhost:3000), enter a username and room, then chat. Use two browser windows to verify multi-user messaging.

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

No application code changes are required — only the URL (and driver).

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:8000` | Backend Socket.IO / API base URL |

## Socket.IO events

### Client → Server

| Event | Payload |
|-------|---------|
| `join_room` | `{ "username": string, "room": string }` |
| `send_message` | `{ "content": string }` |
| `leave_room` | `{}` |

### Server → Client

| Event | Payload |
|-------|---------|
| `message_history` | `{ "room": string, "messages": Message[] }` |
| `new_message` | `Message` |
| `room_users` | `{ "room": string, "users": string[] }` |
| `user_joined` | `{ "username": string, "room": string }` |
| `user_left` | `{ "username": string, "room": string }` |
| `error` | `{ "message": string, "code"?: string }` |

`Message` shape:

```json
{
  "id": 1,
  "username": "alex",
  "content": "Hello",
  "message_type": "user",
  "room": "general",
  "created_at": "2026-07-15T12:00:00+00:00"
}
```

## Database schema

- **rooms** — `id`, `name` (unique), `created_at`
- **messages** — `id`, `room_id`, `username`, `content`, `message_type`, `created_at`
- **sessions** — active Socket.IO presence (`sid`, `username`, `room_id`, `joined_at`)

Tables are created automatically on startup (`create_all`). For production Postgres, consider Alembic migrations later.

## Smoke test (optional)

With the backend running:

```bash
cd backend
venv\Scripts\python scripts\e2e_socket_smoke.py
```

## License

Private / internal use unless otherwise stated.
