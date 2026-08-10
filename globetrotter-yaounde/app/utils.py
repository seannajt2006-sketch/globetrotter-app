"""
app/utils.py

Helper functions for validation, response standardization, ID generation,
and JWT authentication decorator.
"""
import uuid
import re
import datetime
from functools import wraps
import jwt
from flask import request, jsonify, current_app
from app.config import Config


def generate_id() -> str:
    """Generate a unique UUIDv4 string."""
    return str(uuid.uuid4())


def validate_email(email: str) -> bool:
    """Validate email syntax using standard regex."""
    if not email or not isinstance(email, str):
        return False
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return bool(re.match(pattern, email.strip()))


def validate_password(password: str, min_length: int = 6) -> bool:
    """Check if password meets minimum length requirement."""
    if not password or not isinstance(password, str):
        return False
    return len(password) >= min_length


def api_response(success: bool, message: str, data=None, status_code: int = 200):
    """Return a consistent API JSON response envelope.
    
    Successful response:
    {
        "success": true,
        "message": "...",
        "data": { ... }
    }
    
    Error response:
    {
        "success": false,
        "message": "..."
    }
    """
    payload = {
        "success": success,
        "message": message
    }
    if data is not None and success:
        payload["data"] = data

    return jsonify(payload), status_code


def token_required(f):
    """Decorator to enforce valid JWT token authentication on protected endpoints."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return api_response(False, "Authorization token is missing or malformed", status_code=401)
        
        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(
                token,
                current_app.config["SECRET_KEY"],
                algorithms=["HS256"]
            )
            current_user = {
                "user_id": payload.get("user_id"),
                "username": payload.get("sub")
            }
        except jwt.ExpiredSignatureError:
            return api_response(False, "Authentication token has expired", status_code=401)
        except jwt.PyJWTError:
            return api_response(False, "Invalid authentication token", status_code=401)

        return f(current_user, *args, **kwargs)
    return decorated
