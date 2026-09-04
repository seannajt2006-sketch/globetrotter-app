"""
services/community-service/app.py

Flask + Socket.IO microservice handling destination comments (with one-level
replies and up/down votes) and the real-time global community chat (text and
voice messages).
"""
import os
import logging
from functools import wraps

import jwt
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit

from models import CommentModel, ChatMessageModel, VOICE_DIR

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] Community-Service: %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

SECRET_KEY = "globetrotter-super-secret-jwt-key"

# Maps a connected socket's session id to {"user_id", "username"} for the duration of the connection.
connected_users = {}


def api_response(success: bool, message: str, data: dict | list = None, status_code: int = 200):
    payload = {"success": success, "message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status_code


def decode_bearer_token(auth_header: str):
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    try:
        return jwt.decode(parts[1], SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        payload = decode_bearer_token(request.headers.get("Authorization", ""))
        if not payload:
            return api_response(False, "Invalid or missing authentication token", status_code=401)
        return f(current_user=payload, *args, **kwargs)
    return decorated


# ---------------------------------------------------------------------------
# Destination Comments
# ---------------------------------------------------------------------------

@app.route("/comments/<destination_id>", methods=["GET"])
def list_comments(destination_id):
    """Public: anyone can view a destination's comment thread."""
    current_user = decode_bearer_token(request.headers.get("Authorization", ""))
    current_user_id = current_user.get("user_id") if current_user else None
    comments = CommentModel.get_by_destination(destination_id, current_user_id)
    return api_response(True, "Comments retrieved successfully", comments, status_code=200)


@app.route("/comments/<destination_id>", methods=["POST"])
@token_required
def create_comment(current_user, destination_id):
    data = request.get_json(silent=True) or {}
    text = str(data.get("text", "")).strip()
    if not text:
        return api_response(False, "Comment text is required", status_code=400)

    comment = CommentModel.create_comment(
        destination_id=destination_id,
        user_id=current_user.get("user_id"),
        username=current_user.get("sub"),
        text=text
    )
    if not CommentModel.save(comment):
        return api_response(False, "Failed to save comment", status_code=500)

    logger.info(f"User '{current_user.get('sub')}' commented on destination '{destination_id}'.")
    return api_response(True, "Comment posted successfully", comment, status_code=201)


@app.route("/comments/<comment_id>/reply", methods=["POST"])
@token_required
def reply_to_comment(current_user, comment_id):
    data = request.get_json(silent=True) or {}
    text = str(data.get("text", "")).strip()
    if not text:
        return api_response(False, "Reply text is required", status_code=400)

    parent = CommentModel.get_by_id(comment_id)
    if not parent:
        return api_response(False, "Comment not found", status_code=404)
    if parent.get("parent_id"):
        return api_response(False, "Cannot reply to a reply", status_code=400)

    reply = CommentModel.create_comment(
        destination_id=parent["destination_id"],
        user_id=current_user.get("user_id"),
        username=current_user.get("sub"),
        text=text,
        parent_id=comment_id
    )
    if not CommentModel.save(reply):
        return api_response(False, "Failed to save reply", status_code=500)

    return api_response(True, "Reply posted successfully", reply, status_code=201)


@app.route("/comments/<comment_id>/vote", methods=["POST"])
@token_required
def vote_comment(current_user, comment_id):
    data = request.get_json(silent=True) or {}
    vote = str(data.get("vote", "")).strip().lower()
    if vote not in ("up", "down"):
        return api_response(False, "Vote must be 'up' or 'down'", status_code=400)

    updated = CommentModel.vote(comment_id, current_user.get("user_id"), vote)
    if updated is None:
        return api_response(False, "Comment not found", status_code=404)

    return api_response(True, "Vote recorded", {
        "id": updated["id"],
        "upvote_count": len(updated.get("upvotes", [])),
        "downvote_count": len(updated.get("downvotes", []))
    }, status_code=200)


# ---------------------------------------------------------------------------
# Global Community Chat (REST: history backlog + voice file retrieval)
# ---------------------------------------------------------------------------

@app.route("/chat/messages", methods=["GET"])
@token_required
def list_chat_messages(current_user):
    limit = request.args.get("limit", default=50, type=int)
    messages = ChatMessageModel.get_recent(limit=limit)
    return api_response(True, "Chat history retrieved successfully", messages, status_code=200)


@app.route("/chat/voice/<path:filename>", methods=["GET"])
def get_voice_file(filename):
    return send_from_directory(VOICE_DIR, filename)


@app.route("/health", methods=["GET"])
def health():
    return api_response(True, "Community Service is healthy", status_code=200)


# ---------------------------------------------------------------------------
# Socket.IO — live delivery for the global chat
# ---------------------------------------------------------------------------

@socketio.on("connect")
def handle_connect(auth):
    token = (auth or {}).get("token", "")
    payload = decode_bearer_token(f"Bearer {token}") if token else None
    if not payload:
        logger.warning("Rejected Socket.IO connection: invalid or missing token.")
        return False

    connected_users[request.sid] = {
        "user_id": payload.get("user_id"),
        "username": payload.get("sub")
    }
    logger.info(f"User '{payload.get('sub')}' connected to global chat.")


@socketio.on("disconnect")
def handle_disconnect():
    connected_users.pop(request.sid, None)


@socketio.on("send_message")
def handle_send_message(data):
    sender = connected_users.get(request.sid)
    if not sender:
        return

    msg_type = (data or {}).get("type", "text")
    reply_to_id = (data or {}).get("reply_to")
    if msg_type == "voice":
        audio_base64 = (data or {}).get("audio_base64", "")
        duration = (data or {}).get("duration", 0)
        if not audio_base64:
            return
        message = ChatMessageModel.create_voice_message(
            user_id=sender["user_id"],
            username=sender["username"],
            audio_base64=audio_base64,
            duration=duration,
            reply_to_id=reply_to_id
        )
    else:
        content = str((data or {}).get("content", "")).strip()
        if not content:
            return
        message = ChatMessageModel.create_text_message(
            user_id=sender["user_id"],
            username=sender["username"],
            content=content,
            reply_to_id=reply_to_id
        )

    if message and ChatMessageModel.save(message):
        emit("new_message", message, broadcast=True)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5004))
    logger.info(f"Starting Community Service on port {port}...")
    socketio.run(app, host="0.0.0.0", port=port)
