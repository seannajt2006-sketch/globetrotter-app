"""
app/auth.py

User registration and authentication Blueprint.
Provides /register and /login endpoints with JWT issuance.
"""
import datetime
import logging
import jwt
from flask import Blueprint, request, current_app
from app.models import UserModel
from app.storage import load_users, save_users
from app.utils import validate_email, validate_password, api_response

logger = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__)


def create_token(user: dict, secret: str, expiration_hours: int) -> tuple[str, str]:
    """Generate a JWT token for a user and return (token_string, expiration_iso_string)."""
    now = datetime.datetime.now(datetime.timezone.utc)
    expiration = now + datetime.timedelta(hours=expiration_hours)
    payload = {
        "sub": user["username"],
        "user_id": user["id"],
        "iat": now,
        "exp": expiration
    }
    token = jwt.encode(payload, secret, algorithm="HS256")
    return token, expiration.isoformat()


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user account.

    Expected JSON:
    {
        "username": "alice",
        "email": "alice@example.com",
        "password": "password123",
        "preferences": ["beach", "food"]
    }
    """
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    email = str(data.get("email", "")).strip()
    password = str(data.get("password", ""))
    preferences = data.get("preferences", [])

    if not isinstance(preferences, list):
        preferences = []

    # Validation checks
    if not username:
        return api_response(False, "Username is required", status_code=400)

    if not email:
        return api_response(False, "Email address is required", status_code=400)

    if not validate_email(email):
        return api_response(False, "Invalid email address format", status_code=400)

    if not password:
        return api_response(False, "Password is required", status_code=400)

    if not validate_password(password, min_length=6):
        return api_response(False, "Password must be at least 6 characters long", status_code=400)

    # Duplicate checks
    if UserModel.find_by_username(username):
        logger.warning(f"Registration failed: Username '{username}' already exists.")
        return api_response(False, "Username is already taken", status_code=409)

    if UserModel.find_by_email(email):
        logger.warning(f"Registration failed: Email '{email}' already registered.")
        return api_response(False, "Email address is already registered", status_code=409)

    # Create & Save User
    user = UserModel.create_user(username, email, password, preferences)
    users = load_users()
    users.append(user)
    
    if not save_users(users):
        logger.error("Failed to persist new user to storage.")
        return api_response(False, "Failed to save user data", status_code=500)

    logger.info(f"Successfully registered user '{username}' ({email}).")
    return api_response(
        True,
        "User registered successfully",
        {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "preferences": user["preferences"]
        },
        status_code=201
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate a user and return a JWT token with profile info.

    Expected JSON:
    {
        "username": "alice",  (or email)
        "password": "password123"
    }
    """
    data = request.get_json(silent=True) or {}
    identifier = str(data.get("username", "") or data.get("email", "")).strip()
    password = str(data.get("password", ""))

    if not identifier or not password:
        return api_response(False, "Username/Email and password are required", status_code=400)

    # Try lookup by username first, then by email
    user = UserModel.find_by_username(identifier) or UserModel.find_by_email(identifier)

    if not user or not UserModel.verify_password(user["password"], password):
        logger.warning(f"Failed login attempt for '{identifier}'.")
        return api_response(False, "Invalid username or password", status_code=401)

    secret = current_app.config["SECRET_KEY"]
    hours = current_app.config["JWT_EXPIRATION_HOURS"]
    token, expires = create_token(user, secret, hours)

    logger.info(f"User '{user['username']}' authenticated successfully.")

    return api_response(
        True,
        "Login successful",
        {
            "token": token,
            "username": user["username"],
            "user_id": user["id"],
            "expires": expires,
            "preferences": user.get("preferences", [])
        },
        status_code=200
    )
