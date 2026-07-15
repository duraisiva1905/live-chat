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

## How to run the application

You need **two processes**: the FastAPI backend (port **8000**) and the Next.js frontend (port **3000**). Start the backend first.

### Prerequisites

| Tool | Version | Check command |
|------|---------|---------------|
| Python | 3.12+ | `python --version` |
| Node.js | 20+ | `node --version` |
| npm | 9+ | `npm --version` |

Optional for Docker: [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Compose.

---

### Option A — Run locally (recommended for development)

#### Step 1: Clone / open the project

```bash
cd live-chat
```

#### Step 2: Start the backend

Open a terminal in the project root.

**Windows (PowerShell):**

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env   # optional; defaults work without it
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**macOS / Linux:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # optional; defaults work without it
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see something like:

```text
Uvicorn running on http://0.0.0.0:8000
Application startup complete.
```

**Verify the backend:**

- Browser or curl: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- Expected JSON: `{ "status": "ok", "database": "ok" }`
- Rooms list: [http://127.0.0.1:8000/rooms](http://127.0.0.1:8000/rooms)

Leave this terminal running.

#### Step 3: Start the frontend

Open a **second** terminal in the project root.

**Windows (PowerShell):**

```powershell
cd frontend
Copy-Item .env.local.example .env.local
npm install
npm run dev
```

**macOS / Linux:**

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Confirm `.env.local` contains:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

You should see Next.js ready on port 3000.

**Open the app:** [http://localhost:3000](http://localhost:3000)

#### Step 4: Use the chat

1. On the landing page, either select an **active room** from the list or click **Create a new room**.
2. Enter a room name and create it (if needed).
3. Switch back to **Join**, enter a **username** and room name, then click **Join room**.
4. Send messages, check the online users sidebar, and leave via **Leave** (confirmation dialog).
5. Open a **second browser window/tab** (or another browser) with a different username in the same room to verify live messaging.

#### Step 5: Stop the app

- Frontend: `Ctrl+C` in the frontend terminal
- Backend: `Ctrl+C` in the backend terminal
- Deactivate the Python venv (optional): `deactivate`

---

### Option B — Run with Docker Compose

From the project root (`live-chat/`):

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | [http://localhost:3000](http://localhost:3000) |
| Backend health | [http://localhost:8000/health](http://localhost:8000/health) |

SQLite data is stored in the Docker volume `chat_data`.

To stop:

```bash
docker compose down
```

---

### Troubleshooting

| Issue | What to try |
|-------|-------------|
| Frontend cannot connect | Confirm backend is on port 8000 and `NEXT_PUBLIC_SOCKET_URL=http://localhost:8000` in `frontend/.env.local`. Restart `npm run dev` after changing env. |
| Port 8000 already in use | Stop the other process using that port, or change the uvicorn `--port` and match `NEXT_PUBLIC_SOCKET_URL`. |
| `ModuleNotFoundError` on backend | Activate `venv` and run `pip install -r requirements.txt` again. |
| Blank / stale frontend | Delete `frontend/.next` and run `npm run dev` again. |
| Join says room does not exist | Create the room first via **Create a new room**, then join. |

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
