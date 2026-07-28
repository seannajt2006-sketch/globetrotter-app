"""
app/config.py

Configuration settings for the GlobeTrotter Flask application.
Loads values from environment variables with sensible development defaults.
"""
import os
from dotenv import load_dotenv

# Load variables from .env if present
load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Config:
    """Application configuration class."""
    SECRET_KEY = os.environ.get("SECRET_KEY", "globetrotter-secret-key-change-in-production-2026")
    JWT_EXPIRATION_HOURS = int(os.environ.get("JWT_EXPIRATION_HOURS", 24))
    DATA_FOLDER = os.environ.get("DATA_FOLDER", os.path.join(BASE_DIR, "data"))
    DEBUG = os.environ.get("FLASK_DEBUG", "1") == "1"
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost").split(",")

    USERS_FILE = os.path.join(DATA_FOLDER, "users.json")
    DESTINATIONS_FILE = os.path.join(DATA_FOLDER, "destinations.json")
    ITINERARIES_FILE = os.path.join(DATA_FOLDER, "itineraries.json")
