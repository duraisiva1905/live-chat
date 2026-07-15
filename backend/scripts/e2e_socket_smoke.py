"""Manual Socket.IO smoke test against a running local server."""

from __future__ import annotations

import sys
import time

import socketio

results: list[tuple[str, bool, str]] = []


def ok(name: str, cond: bool, detail: str = "") -> None:
    results.append((name, cond, detail))
    print(("PASS" if cond else "FAIL"), name, detail)


def main() -> int:
    a = socketio.Client(reconnection=False)
    b = socketio.Client(reconnection=False)

    a_msgs: list[dict] = []
    b_msgs: list[dict] = []
    a_users: list[dict] = []
    room_lists: list[dict] = []
    a_history: list[dict] = []
    a_errors: list[dict] = []
    created: list[dict] = []
    typing_events: list[dict] = []

    @a.on("message_history")
    def a_hist(data: dict) -> None:
        a_history.append(data)

    @a.on("new_message")
    def a_msg(data: dict) -> None:
        a_msgs.append(data)

    @a.on("room_users")
    def a_ru(data: dict) -> None:
        a_users.append(data)

    @a.on("room_list_updated")
    def a_rl(data: dict) -> None:
        room_lists.append(data)

    @a.on("room_created")
    def a_rc(data: dict) -> None:
        created.append(data)

    @a.on("error")
    def a_err(data: dict) -> None:
        a_errors.append(data)

    @b.on("new_message")
    def b_msg(data: dict) -> None:
        b_msgs.append(data)

    @b.on("typing")
    def b_typing(data: dict) -> None:
        typing_events.append(data)

    @b.on("room_list_updated")
    def b_rl(data: dict) -> None:
        room_lists.append(data)

    a.connect("http://127.0.0.1:8000")
    b.connect("http://127.0.0.1:8000")
    time.sleep(0.4)

    # Join missing room should fail
    a.emit("join_room", {"username": "alice", "room": "alpha-e2e"})
    time.sleep(0.5)
    ok(
        "join missing room fails",
        any(e.get("code") == "room_not_found" for e in a_errors),
        str(a_errors),
    )

    a.emit("create_room", {"room_name": "alpha-e2e", "created_by": "alice"})
    time.sleep(0.5)
    ok("room created", any(r.get("room_name") == "alpha-e2e" for r in created), str(created))

    a.emit("join_room", {"username": "alice", "room": "alpha-e2e"})
    time.sleep(0.5)
    b.emit("join_room", {"username": "bob", "room": "alpha-e2e"})
    time.sleep(0.5)

    ok("a got history", len(a_history) >= 1)
    ok(
        "room list has active users",
        any(
            any(r.get("room_name") == "alpha-e2e" and r.get("active_users", 0) >= 1 for r in payload.get("rooms", []))
            for payload in room_lists
        ),
        str(room_lists[-1] if room_lists else {}),
    )
    ok(
        "structured users payload",
        any(
            isinstance(u.get("users", [None])[0], dict) if u.get("users") else False
            for u in a_users
        ),
        str(a_users[-1] if a_users else {}),
    )

    a.emit("send_message", {"content": "hello from alice"})
    time.sleep(0.5)
    ok(
        "b received alice msg",
        any(m.get("text") == "hello from alice" for m in b_msgs),
        str(b_msgs),
    )
    ok(
        "message has structured fields",
        any(m.get("type") == "chat" and "timestamp" in m for m in b_msgs),
    )

    a.emit("typing", {})
    time.sleep(0.4)
    ok(
        "typing broadcast",
        any(t.get("username") == "alice" for t in typing_events),
        str(typing_events),
    )

    a.emit("leave_room", {})
    time.sleep(0.5)
    b.emit("leave_room", {})
    time.sleep(0.5)

    a.disconnect()
    b.disconnect()

    failed = [r for r in results if not r[1]]
    print("---")
    print(f"{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
