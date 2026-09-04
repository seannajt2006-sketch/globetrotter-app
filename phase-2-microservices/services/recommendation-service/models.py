"""
services/recommendation-service/models.py

Destination catalog model and querying logic.
"""
import os
import json
import logging

logger = logging.getLogger(__name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "destinations.json")


def load_destinations() -> list:
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading destinations: {e}")
        return []


class DestinationModel:
    @staticmethod
    def get_all() -> list:
        return load_destinations()

    @staticmethod
    def filter_destinations(q: str = "", tag: str = "", category: str = "", max_cost: int = None) -> list:
        destinations = load_destinations()
        results = []

        q_lower = q.strip().lower()
        tag_lower = tag.strip().lower()
        category_lower = category.strip().lower()

        for dest in destinations:
            if q_lower:
                searchable = f"{dest.get('name', '')} {dest.get('country', '')} {dest.get('city', '')} {dest.get('description', '')}".lower()
                if q_lower not in searchable:
                    continue

            if tag_lower:
                tags = [t.lower() for t in dest.get("tags", [])]
                if tag_lower not in tags:
                    continue

            if category_lower:
                if dest.get("category", "").lower() != category_lower:
                    continue

            if max_cost is not None:
                cost = dest.get("cost_per_day", 0)
                if cost > max_cost:
                    continue

            results.append(dest)

        return results
