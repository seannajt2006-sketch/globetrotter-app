"""
services/user-service/utils.py

Utility helpers for validation, responses, and JWT management.
"""
import re
import uuid
import datetime
import jwt
from functools import wraps
from flask import request, jsonify, current_app

SECRET_KEY = "globetrotter-super-secret-jwt-key"
JWT_EXPIRATION_HOURS = 24


def generate_id() -> str:
    """Generate a unique string ID."""
    return str(uuid.uuid4())[:8]


def validate_email(email: str) -> bool:
    """Validate email address format."""
    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    return bool(re.match(pattern, email))


def validate_password(password: str, min_length: int = 6) -> bool:
    """Validate password strength."""
    return len(password) >= min_length


def api_response(success: bool, message: str, data: dict | list = None, status_code: int = 200):
    """Standard API response envelope."""
    payload = {
        "success": success,
        "message": message
    }
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status_code


def create_token(user: dict) -> tuple[str, str]:
    """Generate a JWT token for a user and return (token_string, expiration_iso)."""
    now = datetime.datetime.now(datetime.timezone.utc)
    expiration = now + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user["username"],
        "user_id": user["id"],
        "iat": now,
        "exp": expiration
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token, expiration.isoformat()


def decode_token(token: str) -> dict | None:
    """Decode and verify JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.PyJWTError:
        return None


def token_required(f):
    """Decorator to enforce valid JWT authentication on routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header:
            return api_response(False, "Authorization header missing", status_code=401)
            
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return api_response(False, "Invalid Authorization header format", status_code=401)
            
        payload = decode_token(parts[1])
        if not payload:
            return api_response(False, "Invalid or expired authentication token", status_code=401)
            
        return f(current_user=payload, *args, **kwargs)
    return decorated
