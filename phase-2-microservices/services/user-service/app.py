"""
services/user-service/app.py

Flask microservice for managing User registration, login, profiles, and preference tags.
"""
import os
import logging
from flask import Flask, request
from flask_cors import CORS
from models import UserModel, load_users, save_users
from utils import (
    api_response, validate_email, validate_password,
    create_token, token_required, decode_token
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] User-Service: %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)


@app.route("/users/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    email = str(data.get("email", "")).strip()
    password = str(data.get("password", ""))
    preferences = data.get("preferences", [])

    if not isinstance(preferences, list):
        preferences = []

    if not username:
        return api_response(False, "Username is required", status_code=400)
    if not email:
        return api_response(False, "Email address is required", status_code=400)
    if not validate_email(email):
        return api_response(False, "Invalid email address format", status_code=400)
    if not password or not validate_password(password, min_length=6):
        return api_response(False, "Password must be at least 6 characters long", status_code=400)

    if UserModel.find_by_username(username):
        return api_response(False, "Username is already taken", status_code=409)
    if UserModel.find_by_email(email):
        return api_response(False, "Email address is already registered", status_code=409)

    user = UserModel.create_user(username, email, password, preferences)
    users = load_users()
    users.append(user)

    if not save_users(users):
        return api_response(False, "Failed to persist user data", status_code=500)

    logger.info(f"Registered new user '{username}' ({email}).")
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


@app.route("/users/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    identifier = str(data.get("username", "") or data.get("email", "")).strip()
    password = str(data.get("password", ""))

    if not identifier or not password:
        return api_response(False, "Username/Email and password are required", status_code=400)

    user = UserModel.find_by_username(identifier) or UserModel.find_by_email(identifier)

    if not user or not UserModel.verify_password(user["password"], password):
        return api_response(False, "Invalid username or password", status_code=401)

    token, expires = create_token(user)

    logger.info(f"User '{user['username']}' logged in successfully.")
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


@app.route("/users/<user_id>", methods=["GET"])
def get_user_profile(user_id):
    """Retrieve user profile by ID (internal or client REST endpoint)."""
    user = UserModel.find_by_id(user_id)
    if not user:
        # Fallback check by username
        user = UserModel.find_by_username(user_id)
        
    if not user:
        return api_response(False, "User not found", status_code=404)

    return api_response(
        True,
        "User profile retrieved",
        {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "preferences": user.get("preferences", [])
        },
        status_code=200
    )


@app.route("/users/verify", methods=["POST"])
def verify_token():
    """Verify JWT token and return decoded payload."""
    data = request.get_json(silent=True) or {}
    token = data.get("token", "")
    payload = decode_token(token)
    if not payload:
        return api_response(False, "Invalid or expired token", status_code=401)
    return api_response(True, "Token valid", payload, status_code=200)


@app.route("/health", methods=["GET"])
def health():
    return api_response(True, "User Service is healthy", status_code=200)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
