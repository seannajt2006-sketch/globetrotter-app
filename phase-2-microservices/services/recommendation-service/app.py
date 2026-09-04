"""
services/recommendation-service/app.py

Flask microservice for place search and personalized travel recommendations.
Uses synchronous REST APIs to query User Service and Itinerary Service.
Uses RabbitMQ background consumer for event-driven updates.
"""
import os
import logging
import requests
import jwt
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS

from models import DestinationModel
from consumer import start_rabbitmq_consumer, EVENT_LOG

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] Recommendation-Service: %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

SECRET_KEY = "globetrotter-super-secret-jwt-key"

USER_SERVICE_URL = os.environ.get("USER_SERVICE_URL", "http://user-service:5001")
ITINERARY_SERVICE_URL = os.environ.get("ITINERARY_SERVICE_URL", "http://itinerary-service:5002")
VALID_CATEGORIES = ["restaurant", "market", "cafe", "accommodation", "cultural"]


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


@app.route("/destinations", methods=["GET"])
def search_destinations():
    """Search and filter places in Yaoundé."""
    q = request.args.get("q", "").strip()
    category = request.args.get("category", "").strip().lower()
    tag = request.args.get("tag", "").strip()
    max_cost_str = request.args.get("max_cost", "").strip()

    max_cost = None
    if max_cost_str:
        try:
            max_cost = int(max_cost_str)
        except ValueError:
            return api_response(False, "max_cost parameter must be an integer", status_code=400)

    if category and category not in VALID_CATEGORIES:
        return api_response(False, f"Invalid category '{category}'. Valid: {', '.join(VALID_CATEGORIES)}", status_code=400)

    results = DestinationModel.filter_destinations(q=q, tag=tag, category=category, max_cost=max_cost)
    return api_response(True, f"Found {len(results)} place(s)", results, status_code=200)


@app.route("/recommendations", methods=["GET"])
@token_required
def get_recommendations(current_user):
    """Personalized recommendations generated via REST inter-service calls."""
    user_id = current_user.get("user_id")
    username = current_user.get("username")

    limit_str = request.args.get("limit", "5")
    try:
        limit = max(1, int(limit_str))
    except ValueError:
        return api_response(False, "limit parameter must be a positive integer", status_code=400)

    # Synchronous REST call to User Service to get profile & preferences
    user_prefs = []
    try:
        u_res = requests.get(f"{USER_SERVICE_URL}/users/{user_id}", timeout=4)
        if u_res.status_code == 200:
            user_data = u_res.json().get("data", {})
            user_prefs = [p.lower() for p in user_data.get("preferences", [])]
        else:
            logger.warning(f"Could not fetch user profile from User Service (Status: {u_res.status_code})")
    except Exception as err:
        logger.error(f"Failed inter-service REST call to User Service: {err}")

    # Synchronous REST call to Itinerary Service to check user's existing itinerary destinations
    existing_destinations = set()
    try:
        i_res = requests.get(f"{ITINERARY_SERVICE_URL}/itineraries/user/{user_id}", timeout=4)
        if i_res.status_code == 200:
            itineraries = i_res.json().get("data", [])
            for itin in itineraries:
                dest_name = itin.get("destination", "").lower()
                if dest_name:
                    existing_destinations.add(dest_name)
    except Exception as err:
        logger.error(f"Failed inter-service REST call to Itinerary Service: {err}")

    all_destinations = DestinationModel.get_all()
    scored_destinations = []

    for dest in all_destinations:
        dest_tags = [t.lower() for t in dest.get("tags", [])]
        match_score = sum(1 for pref in user_prefs if pref in dest_tags)
        
        # Give bonus or penalty based on trip history from Itinerary Service
        dest_name = dest.get("name", "").lower()
        already_visited = dest_name in existing_destinations

        dest_copy = dict(dest)
        dest_copy["match_score"] = match_score
        dest_copy["already_in_itinerary"] = already_visited
        scored_destinations.append(dest_copy)

    # Sort descending by match_score, then rating
    scored_destinations.sort(key=lambda d: (-d["match_score"], -d.get("rating", 0)))
    recommendations = scored_destinations[:limit]

    return api_response(
        True,
        "Personalized recommendations calculated",
        recommendations,
        status_code=200
    )


@app.route("/health", methods=["GET"])
def health():
    return api_response(True, "Recommendation Service is healthy", status_code=200)


# Start background RabbitMQ consumer upon microservice initialization
start_rabbitmq_consumer()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5003))
    app.run(host="0.0.0.0", port=port, debug=False)
