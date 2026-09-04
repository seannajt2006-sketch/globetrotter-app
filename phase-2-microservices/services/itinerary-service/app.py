"""
services/itinerary-service/app.py

Flask microservice for managing travel itineraries and publishing domain events.
"""
import os
import logging
import jwt
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import ItineraryModel
from messaging import publish_itinerary_created_event

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] Itinerary-Service: %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

SECRET_KEY = "globetrotter-super-secret-jwt-key"


def api_response(success: bool, message: str, data: dict | list = None, status_code: int = 200):
    payload = {"success": success, "message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status_code


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header:
            return api_response(False, "Authorization header missing", status_code=401)
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return api_response(False, "Invalid Authorization header format", status_code=401)
        try:
            payload = jwt.decode(parts[1], SECRET_KEY, algorithms=["HS256"])
            return f(current_user=payload, *args, **kwargs)
        except jwt.PyJWTError:
            return api_response(False, "Invalid or expired token", status_code=401)
    return decorated


@app.route("/itineraries", methods=["POST"])
@token_required
def create_itinerary(current_user):
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
        return api_response(False, "Failed to save itinerary", status_code=500)

    # Publish asynchronous domain event to RabbitMQ
    publish_itinerary_created_event(itinerary)

    logger.info(f"Created itinerary '{itinerary['id']}' for user '{user_id}'.")
    return api_response(True, "Itinerary created successfully", itinerary, status_code=201)


@app.route("/itineraries", methods=["GET"])
@token_required
def list_itineraries(current_user):
    user_id = current_user.get("user_id")
    user_itineraries = ItineraryModel.get_by_user_id(user_id)
    return api_response(True, "Itineraries retrieved successfully", user_itineraries, status_code=200)


@app.route("/itineraries/user/<user_id>", methods=["GET"])
def get_user_itineraries_internal(user_id):
    """Internal REST endpoint for other microservices (e.g. Recommendation Service)."""
    user_itineraries = ItineraryModel.get_by_user_id(user_id)
    return api_response(True, "User itineraries retrieved", user_itineraries, status_code=200)


@app.route("/health", methods=["GET"])
def health():
    return api_response(True, "Itinerary Service is healthy", status_code=200)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5002))
    app.run(host="0.0.0.0", port=port, debug=False)
