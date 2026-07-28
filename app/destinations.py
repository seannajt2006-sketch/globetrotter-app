"""
app/destinations.py
Destination search Blueprint for Yaoundé Local Places.
Provides GET /destinations endpoint supporting query parameters including
category filtering for restaurants, markets, cafés, accommodations, and cultural sites.
"""
import logging
from flask import Blueprint, request
from app.models import DestinationModel
from app.utils import api_response
logger = logging.getLogger(__name__)
destinations_bp = Blueprint("destinations", __name__)

VALID_CATEGORIES = ["restaurant", "market", "cafe", "accommodation", "cultural"]

@destinations_bp.route("/destinations", methods=["GET"])
def search_destinations():
    """Search and filter local places in Yaoundé.
    Query parameters (all optional):
        q          – free-text filter against name, address, description
        category   – filter by place category (restaurant, market, cafe, accommodation, cultural)
        tag        – filter by a single interest tag (e.g. "food")
        max_cost   – filter by maximum daily cost integer
    """
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
    # Validate category
    if category and category not in VALID_CATEGORIES:
        return api_response(
            False,
            f"Invalid category '{category}'. Valid categories: {', '.join(VALID_CATEGORIES)}",
            status_code=400
        )
    logger.info(f"Searching Yaoundé places with params q='{q}', category='{category}', tag='{tag}', max_cost={max_cost}")
    results = DestinationModel.filter_destinations(
        q=q,
        tag=tag,
        category=category,
        max_cost=max_cost
    )
    return api_response(
        True,
        f"Found {len(results)} place(s) in Yaoundé",
        results,
        status_code=200
    )
