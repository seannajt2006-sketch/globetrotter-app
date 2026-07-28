"""
app/storage.py

Low-level JSON file I/O operations and entity storage managers.
Handles loading and persisting users, destinations, and itineraries.
"""
import json
import os
import logging
from flask import current_app

logger = logging.getLogger(__name__)


def read_json(filepath: str) -> list:
    """Read a JSON file safely and return its parsed contents as a list.

    Returns an empty list if the file does not exist, is empty, or contains invalid JSON.
    """
    if not os.path.exists(filepath):
        logger.info(f"File not found at {filepath}. Returning empty list.")
        return []
    try:
        with open(filepath, "r", encoding="utf-8") as fh:
            content = fh.read().strip()
            if not content:
                return []
            return json.loads(content)
    except (json.JSONDecodeError, OSError) as exc:
        logger.error(f"Error reading JSON file {filepath}: {exc}")
        return []


def write_json(filepath: str, data: list) -> bool:
    """Atomically write data to a JSON file formatted with indent=2."""
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2, ensure_ascii=False)
        return True
    except OSError as exc:
        logger.error(f"Error writing to JSON file {filepath}: {exc}")
        return False


# User Storage Operations
def load_users() -> list:
    """Load all users from disk."""
    return read_json(current_app.config["USERS_FILE"])


def save_users(users: list) -> bool:
    """Save user list to disk."""
    return write_json(current_app.config["USERS_FILE"], users)


# Destination Storage Operations
def load_destinations() -> list:
    """Load all destinations from disk."""
    return read_json(current_app.config["DESTINATIONS_FILE"])


def save_destinations(destinations: list) -> bool:
    """Save destination catalogue to disk."""
    return write_json(current_app.config["DESTINATIONS_FILE"], destinations)


# Itinerary Storage Operations
def load_itineraries() -> list:
    """Load all user itineraries from disk."""
    return read_json(current_app.config["ITINERARIES_FILE"])


def save_itineraries(itineraries: list) -> bool:
    """Save itinerary list to disk."""
    return write_json(current_app.config["ITINERARIES_FILE"], itineraries)
