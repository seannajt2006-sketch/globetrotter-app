"""
app/models.py

Data model constructors and query/validation abstractions.
Uses storage.py for persistence while keeping model schemas consistent.
"""
from werkzeug.security import generate_password_hash, check_password_hash
from app.storage import (
    load_users, save_users,
    load_destinations,
    load_itineraries, save_itineraries
)
from app.utils import generate_id, validate_email, validate_password


class UserModel:
    """User data model and queries."""

    @staticmethod
    def create_user(username: str, email: str, raw_password: str, preferences: list = None) -> dict:
        """Create a new user dictionary adhering to the user schema."""
        return {
            "id": generate_id(),
            "username": username.strip(),
            "email": email.strip().lower(),
            "password": generate_password_hash(raw_password),
            "preferences": preferences or []
        }

    @staticmethod
    def find_by_username(username: str) -> dict | None:
        """Find a user by username (case-insensitive search)."""
        users = load_users()
        username_lower = username.strip().lower()
        for u in users:
            if u.get("username", "").strip().lower() == username_lower:
                return u
        return None

    @staticmethod
    def find_by_email(email: str) -> dict | None:
        """Find a user by email (case-insensitive search)."""
        users = load_users()
        email_lower = email.strip().lower()
        for u in users:
            if u.get("email", "").strip().lower() == email_lower:
                return u
        return None

    @staticmethod
    def find_by_id(user_id: str) -> dict | None:
        """Find a user by user_id."""
        users = load_users()
        for u in users:
            if u.get("id") == user_id:
                return u
        return None

    @staticmethod
    def verify_password(stored_password_hash: str, raw_password: str) -> bool:
        """Check raw password against Werkzeug password hash."""
        return check_password_hash(stored_password_hash, raw_password)


class DestinationModel:
    """Destination data model and queries."""

    @staticmethod
    def get_all() -> list:
        """Get all destinations in catalogue."""
        return load_destinations()

    @staticmethod
    def filter_destinations(q: str = "", tag: str = "", category: str = "", max_cost: int = None) -> list:
        """Filter destinations using optional parameters."""
        destinations = load_destinations()
        results = []

        q_lower = q.strip().lower()
        tag_lower = tag.strip().lower()
        category_lower = category.strip().lower()

        for dest in destinations:
            # Free-text filter across name, address, city, and description
            if q_lower:
                searchable = f"{dest.get('name', '')} {dest.get('address', '')} {dest.get('city', '')} {dest.get('description', '')}".lower()
                if q_lower not in searchable:
                    continue

            # Tag filter
            if tag_lower:
                tags = [t.lower() for t in dest.get("tags", [])]
                if tag_lower not in tags:
                    continue

            # Category filter (restaurant, market, cafe, accommodation, cultural)
            if category_lower:
                if dest.get("category", "").lower() != category_lower:
                    continue

            # Max cost filter
            if max_cost is not None:
                cost = dest.get("cost_per_day", 0)
                if cost > max_cost:
                    continue

            results.append(dest)

        return results


class ItineraryModel:
    """Itinerary data model and queries."""

    @staticmethod
    def create_itinerary(user_id: str, title: str, destination: str, start_date: str, end_date: str, activities: list = None, notes: str = "") -> dict:
        """Create a new itinerary record adhering to the itinerary schema."""
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
        """Get all itineraries for a specific user_id."""
        itineraries = load_itineraries()
        return [it for it in itineraries if it.get("user_id") == user_id]

    @staticmethod
    def save(itinerary: dict) -> bool:
        """Persist an itinerary record."""
        itineraries = load_itineraries()
        itineraries.append(itinerary)
        return save_itineraries(itineraries)
