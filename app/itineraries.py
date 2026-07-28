"""
app/itineraries.py

Itinerary management Blueprint.
Provides POST /itineraries (create) and GET /itineraries (list) endpoints.
Both routes are protected by JWT authentication.
"""
import logging
from flask import Blueprint, request
from app.models import ItineraryModel
from app.utils import token_required, api_response

logger = logging.getLogger(__name__)
itineraries_bp = Blueprint("itineraries", __name__)


@itineraries_bp.route("/itineraries", methods=["POST"])
@token_required
def create_itinerary(current_user):
    """Create a new travel itinerary for the logged-in user.

    Requires: Authorization: Bearer <JWT>
    Expected JSON:
    {
        "title": "Summer Trip to Paris",
        "destination": "Paris, France",
        "start_date": "2026-08-01",
        "end_date": "2026-08-10",
        "activities": ["Visit Eiffel Tower", "Explore Louvre"],
        "notes": "Pack walking shoes"
    }
    """
    user_id = current_user.get("user_id")
    data = request.get_json(silent=True) or {}

    title = str(data.get("title", "")).strip()
    destination = str(data.get("destination", "")).strip()
    start_date = str(data.get("start_date", "")).strip()
    end_date = str(data.get("end_date", "")).strip()
    activities = data.get("activities", [])
    notes = str(data.get("notes", "")).strip()

    if not title:
        return api_response(False, "Itinerary title is required", status_code=400)

    if not destination:
        return api_response(False, "Destination is required", status_code=400)

    if not isinstance(activities, list):
        activities = []

    itinerary = ItineraryModel.create_itinerary(
        user_id=user_id,
        title=title,
        destination=destination,
        start_date=start_date,
        end_date=end_date,
        activities=activities,
        notes=notes
    )

    if not ItineraryModel.save(itinerary):
        logger.error(f"Failed to save itinerary for user_id '{user_id}'.")
        return api_response(False, "Failed to save itinerary", status_code=500)

    logger.info(f"Created itinerary '{itinerary['id']}' for user_id '{user_id}'.")
    return api_response(
        True,
        "Itinerary created successfully",
        itinerary,
        status_code=201
    )


@itineraries_bp.route("/itineraries", methods=["GET"])
@token_required
def list_itineraries(current_user):
    """List all itineraries owned by the authenticated user.

    Requires: Authorization: Bearer <JWT>
    """
    user_id = current_user.get("user_id")
    user_itineraries = ItineraryModel.get_by_user_id(user_id)

    logger.info(f"Retrieved {len(user_itineraries)} itineraries for user_id '{user_id}'.")
    return api_response(
        True,
        "Itineraries retrieved successfully",
        user_itineraries,
        status_code=200
    )
