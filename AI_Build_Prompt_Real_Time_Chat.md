# AI Build Prompt – Real-Time Chat Application

## Objective
Build a production-style real-time chat application using Next.js 15 and FastAPI.

## Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Socket.IO Client
- FastAPI
- Python 3.12
- python-socketio
- Uvicorn

## Features
- Join room by username and room name
- Real-time messaging
- Online users sidebar
- System join/leave messages
- Message timestamps
- Auto-scroll
- Responsive UI
- Health endpoint

## Architecture
Frontend:
- app/
- components/
- hooks/
- lib/
- types/

Backend:
- app/
- main.py
- socket_manager.py
- room_manager.py
- models.py
- schemas.py

Use clean architecture, reusable components, async APIs, Pydantic validation, TypeScript strict mode, accessibility, loading/error states, and modern Slack-like UI.

Include:
- README
- Docker Compose
- Clear Git commits
