"""
services/user-service/models.py

Data model and storage abstractions for User Service.
"""
import os
import json
import logging
from werkzeug.security import generate_password_hash, check_password_hash
from utils import generate_id

logger = logging.getLogger(__name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "users.json")


def load_users() -> list:
    """Load users array atomically from JSON file."""
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading users: {e}")
        return []


def save_users(users: list) -> bool:
    """Save users array atomically to JSON file."""
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    temp_file = f"{DATA_FILE}.tmp"
    try:
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
        os.replace(temp_file, DATA_FILE)
        return True
    except Exception as e:
        logger.error(f"Error saving users: {e}")
        if os.path.exists(temp_file):
            os.remove(temp_file)
        return False


class UserModel:
    """User entity model and queries."""

    @staticmethod
    def create_user(username: str, email: str, raw_password: str, preferences: list = None) -> dict:
        return {
            "id": generate_id(),
            "username": username.strip(),
            "email": email.strip().lower(),
            "password": generate_password_hash(raw_password),
            "preferences": preferences or []
        }

    @staticmethod
    def find_by_username(username: str) -> dict | None:
        users = load_users()
        uname = username.strip().lower()
        for u in users:
            if u.get("username", "").strip().lower() == uname:
                return u
        return None

    @staticmethod
    def find_by_email(email: str) -> dict | None:
        users = load_users()
        em = email.strip().lower()
        for u in users:
            if u.get("email", "").strip().lower() == em:
                return u
        return None

    @staticmethod
    def find_by_id(user_id: str) -> dict | None:
        users = load_users()
        for u in users:
            if u.get("id") == user_id:
                return u
        return None

    @staticmethod
    def verify_password(stored_hash: str, raw_password: str) -> bool:
        return check_password_hash(stored_hash, raw_password)
