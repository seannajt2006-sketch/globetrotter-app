"""
app/recommendations.py
Personalized place recommendations Blueprint for Yaoundé.
Provides GET /recommendations endpoint matching user preference tags against Yaoundé places.
"""
import logging
from flask import Blueprint, request
from app.models import UserModel, DestinationModel
from app.utils import token_required, api_response
logger = logging.getLogger(__name__)
recommendations_bp = Blueprint("recommendations", __name__)
@recommendations_bp.route("/recommendations", methods=["GET"])
@token_required
def get_recommendations(current_user):
    """Return personalized recommendations for the authenticated user based on preference tags.
    Requires: Authorization: Bearer <JWT>
    Query params:
        limit – maximum number of recommendations to return (default: 5)
    """
    user_id = current_user.get("user_id")
    username = current_user.get("username")
    user = UserModel.find_by_id(user_id) or UserModel.find_by_username(username)
    if not user:
        logger.warning(f"User not found for recommendations: user_id='{user_id}', username='{username}'")
        return api_response(False, "User account not found", status_code=404)
    user_prefs = [p.lower() for p in user.get("preferences", [])]
    # Parse limit parameter
    limit_str = request.args.get("limit", "5")
    try:
        limit = max(1, int(limit_str))
    except ValueError:
        return api_response(False, "limit parameter must be a positive integer", status_code=400)
    destinations = DestinationModel.get_all()
    # Calculate match score for each place based on tag matches
    scored_destinations = []
    for dest in destinations:
        dest_tags = [t.lower() for t in dest.get("tags", [])]
        match_score = sum(1 for pref in user_prefs if pref in dest_tags)
        dest_copy = dict(dest)
        dest_copy["match_score"] = match_score
        scored_destinations.append(dest_copy)
    # Sort descending by match_score, then alphabetically by place name
    scored_destinations.sort(key=lambda d: (-d["match_score"], d.get("name", "")))
    recommendations = scored_destinations[:limit]
    logger.info(f"Generated {len(recommendations)} recommendations for user '{user['username']}'.")
    return api_response(
        True,
        "Personalized recommendations retrieved successfully",
        recommendations,
        status_code=200
    )
