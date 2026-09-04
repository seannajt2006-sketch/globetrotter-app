"""
services/community-service/models.py

Comment (with replies + up/down votes) and chat message storage using JSON
files with atomic writes, following the same pattern as itinerary-service.
"""
import os
import json
import uuid
import base64
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
COMMENTS_FILE = os.path.join(DATA_DIR, "comments.json")
MESSAGES_FILE = os.path.join(DATA_DIR, "chat_messages.json")
VOICE_DIR = os.path.join(DATA_DIR, "voice")


def _load(file_path: str) -> list:
    if not os.path.exists(file_path):
        return []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading {file_path}: {e}")
        return []


def _save(file_path: str, items: list) -> bool:
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    temp_file = f"{file_path}.tmp"
    try:
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(items, f, indent=2)
        os.replace(temp_file, file_path)
        return True
    except Exception as e:
        logger.error(f"Error saving {file_path}: {e}")
        if os.path.exists(temp_file):
            os.remove(temp_file)
        return False


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class CommentModel:
    @staticmethod
    def create_comment(destination_id: str, user_id: str, username: str, text: str, parent_id: str = None) -> dict:
        return {
            "id": f"cmt-{str(uuid.uuid4())[:8]}",
            "destination_id": destination_id,
            "parent_id": parent_id,
            "user_id": user_id,
            "username": username,
            "text": text,
            "created_at": _now_iso(),
            "upvotes": [],
            "downvotes": []
        }

    @staticmethod
    def save(comment: dict) -> bool:
        comments = _load(COMMENTS_FILE)
        comments.append(comment)
        return _save(COMMENTS_FILE, comments)

    @staticmethod
    def get_by_id(comment_id: str) -> dict | None:
        for c in _load(COMMENTS_FILE):
            if c["id"] == comment_id:
                return c
        return None

    @staticmethod
    def vote(comment_id: str, user_id: str, vote: str) -> dict | None:
        """Toggle an up/down vote for user_id on comment_id (mutually exclusive)."""
        comments = _load(COMMENTS_FILE)
        target = None
        for c in comments:
            if c["id"] == comment_id:
                target = c
                break
        if target is None:
            return None

        upvotes = set(target.get("upvotes", []))
        downvotes = set(target.get("downvotes", []))

        if vote == "up":
            if user_id in upvotes:
                upvotes.discard(user_id)
            else:
                upvotes.add(user_id)
                downvotes.discard(user_id)
        else:
            if user_id in downvotes:
                downvotes.discard(user_id)
            else:
                downvotes.add(user_id)
                upvotes.discard(user_id)

        target["upvotes"] = list(upvotes)
        target["downvotes"] = list(downvotes)
        _save(COMMENTS_FILE, comments)
        return target

    @staticmethod
    def get_by_destination(destination_id: str, current_user_id: str = None) -> list:
        """Return top-level comments for a destination, each with one level of nested replies."""
        comments = _load(COMMENTS_FILE)
        dest_comments = [c for c in comments if c.get("destination_id") == destination_id]
        top_level = [c for c in dest_comments if not c.get("parent_id")]
        top_level.sort(key=lambda c: c["created_at"], reverse=True)

        def serialize(c: dict, replies: list) -> dict:
            upvotes = c.get("upvotes", [])
            downvotes = c.get("downvotes", [])
            my_vote = None
            if current_user_id:
                if current_user_id in upvotes:
                    my_vote = "up"
                elif current_user_id in downvotes:
                    my_vote = "down"
            return {
                "id": c["id"],
                "destination_id": c["destination_id"],
                "parent_id": c.get("parent_id"),
                "user_id": c["user_id"],
                "username": c["username"],
                "text": c["text"],
                "created_at": c["created_at"],
                "upvote_count": len(upvotes),
                "downvote_count": len(downvotes),
                "my_vote": my_vote,
                "replies": [serialize(r, []) for r in replies]
            }

        result = []
        for c in top_level:
            replies = sorted(
                [r for r in dest_comments if r.get("parent_id") == c["id"]],
                key=lambda r: r["created_at"]
            )
            result.append(serialize(c, replies))
        return result


class ChatMessageModel:
    @staticmethod
    def _build_reply_preview(reply_to_id: str) -> dict | None:
        if not reply_to_id:
            return None
        for m in _load(MESSAGES_FILE):
            if m["id"] == reply_to_id:
                preview = m["content"] if m["type"] == "text" else "🎤 Voice message"
                return {"id": m["id"], "username": m["username"], "preview": (preview or "")[:120]}
        return None

    @staticmethod
    def create_text_message(user_id: str, username: str, content: str, reply_to_id: str = None) -> dict:
        return {
            "id": f"msg-{str(uuid.uuid4())[:8]}",
            "user_id": user_id,
            "username": username,
            "type": "text",
            "content": content,
            "audio_url": None,
            "duration": None,
            "reply_to": ChatMessageModel._build_reply_preview(reply_to_id),
            "created_at": _now_iso()
        }

    @staticmethod
    def create_voice_message(user_id: str, username: str, audio_base64: str, duration: float = 0, reply_to_id: str = None) -> dict | None:
        """Decode a base64 (optionally data-URL prefixed) audio blob and persist it as a .webm file."""
        try:
            _, _, encoded = audio_base64.partition(",")
            binary = base64.b64decode(encoded or audio_base64)
        except Exception as e:
            logger.error(f"Error decoding voice message audio: {e}")
            return None

        os.makedirs(VOICE_DIR, exist_ok=True)
        filename = f"{uuid.uuid4()}.webm"
        file_path = os.path.join(VOICE_DIR, filename)
        try:
            with open(file_path, "wb") as f:
                f.write(binary)
        except Exception as e:
            logger.error(f"Error writing voice file: {e}")
            return None

        return {
            "id": f"msg-{str(uuid.uuid4())[:8]}",
            "user_id": user_id,
            "username": username,
            "type": "voice",
            "content": None,
            "audio_url": f"/chat/voice/{filename}",
            "duration": duration,
            "reply_to": ChatMessageModel._build_reply_preview(reply_to_id),
            "created_at": _now_iso()
        }

    @staticmethod
    def save(message: dict) -> bool:
        messages = _load(MESSAGES_FILE)
        messages.append(message)
        return _save(MESSAGES_FILE, messages)

    @staticmethod
    def get_recent(limit: int = 50) -> list:
        messages = _load(MESSAGES_FILE)
        messages.sort(key=lambda m: m["created_at"])
        return messages[-limit:] if limit else messages
