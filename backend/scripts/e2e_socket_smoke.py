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
    c = socketio.Client(reconnection=False)

    a_msgs: list[dict] = []
    b_msgs: list[dict] = []
    c_msgs: list[dict] = []
    a_users: list[dict] = []
    b_users: list[dict] = []
    a_history: list[dict] = []
    d_errors: list[dict] = []

    @a.on("message_history")
    def a_hist(data: dict) -> None:
        a_history.append(data)

    @a.on("new_message")
    def a_msg(data: dict) -> None:
        a_msgs.append(data)

    @a.on("room_users")
    def a_ru(data: dict) -> None:
        a_users.append(data)

    @b.on("new_message")
    def b_msg(data: dict) -> None:
        b_msgs.append(data)

    @b.on("room_users")
    def b_ru(data: dict) -> None:
        b_users.append(data)

    @c.on("new_message")
    def c_msg(data: dict) -> None:
        c_msgs.append(data)

    a.connect("http://127.0.0.1:8000")
    b.connect("http://127.0.0.1:8000")
    c.connect("http://127.0.0.1:8000")

    a.emit("join_room", {"username": "alice", "room": "alpha"})
    time.sleep(0.6)
    b.emit("join_room", {"username": "bob", "room": "alpha"})
    time.sleep(0.6)
    c.emit("join_room", {"username": "carol", "room": "beta"})
    time.sleep(0.6)

    a.emit("send_message", {"content": "hello from alice"})
    time.sleep(0.6)

    ok("a got history", len(a_history) >= 1)
    ok(
        "both in room users",
        any(set(u.get("users", [])) >= {"alice", "bob"} for u in a_users + b_users),
    )
    ok(
        "b received alice msg",
        any(m.get("content") == "hello from alice" for m in b_msgs),
    )
    ok(
        "c did not get alpha msg",
        not any(m.get("content") == "hello from alice" for m in c_msgs),
        f"c_msgs={c_msgs}",
    )

    d = socketio.Client(reconnection=False)

    @d.on("error")
    def d_err(data: dict) -> None:
        d_errors.append(data)

    d.connect("http://127.0.0.1:8000")
    d.emit("join_room", {"username": "alice", "room": "alpha"})
    time.sleep(0.6)
    ok(
        "duplicate username rejected",
        any(e.get("code") == "username_taken" for e in d_errors),
        str(d_errors),
    )

    a.emit("leave_room", {})
    time.sleep(0.5)

    e = socketio.Client(reconnection=False)
    e_hist: list[dict] = []

    @e.on("message_history")
    def e_h(data: dict) -> None:
        e_hist.append(data)

    e.connect("http://127.0.0.1:8000")
    e.emit("join_room", {"username": "erin", "room": "alpha"})
    time.sleep(0.6)
    hist_contents = [m.get("content") for m in (e_hist[0]["messages"] if e_hist else [])]
    ok("history persisted", "hello from alice" in hist_contents, str(hist_contents))

    for client in (a, b, c, d, e):
        client.disconnect()

    failed = [r for r in results if not r[1]]
    print("---")
    print(f"{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
