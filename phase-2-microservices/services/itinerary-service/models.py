"""
services/itinerary-service/models.py

Itinerary model and JSON storage operations.
"""
import os
import json
import uuid
import logging

logger = logging.getLogger(__name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "itineraries.json")


def generate_id() -> str:
    return f"itin-{str(uuid.uuid4())[:8]}"


def load_itineraries() -> list:
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading itineraries: {e}")
        return []


def save_itineraries(itineraries: list) -> bool:
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    temp_file = f"{DATA_FILE}.tmp"
    try:
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(itineraries, f, indent=2)
        os.replace(temp_file, DATA_FILE)
        return True
    except Exception as e:
        logger.error(f"Error saving itineraries: {e}")
        if os.path.exists(temp_file):
            os.remove(temp_file)
        return False


class ItineraryModel:
    @staticmethod
    def create_itinerary(user_id: str, title: str, destination: str, start_date: str, end_date: str, activities: list = None, notes: str = "") -> dict:
        return {
            "id": generate_id(),
            "user_id": user_id,
            "title": title.strip(),
            "destination": destination.strip(),
            "start_date": start_date.strip(),
            "end_date": end_date.strip(),
            "activities": activities or [],
            "notes": notes.strip()
        }

    @staticmethod
    def get_by_user_id(user_id: str) -> list:
        itineraries = load_itineraries()
        return [it for it in itineraries if str(it.get("user_id")) == str(user_id)]

    @staticmethod
    def get_all() -> list:
        return load_itineraries()

    @staticmethod
    def save(itinerary: dict) -> bool:
        itineraries = load_itineraries()
        itineraries.append(itinerary)
        return save_itineraries(itineraries)
