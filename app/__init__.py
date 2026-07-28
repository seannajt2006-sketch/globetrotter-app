"""
app/__init__.py

Flask application factory.
Configures logging, CORS, registers Blueprints, and defines the /health route.
"""
import logging
import os
from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.utils import api_response


def create_app(config_class=Config):
    """Create and configure the Flask application instance."""
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )
    logger = logging.getLogger(__name__)

    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure CORS for frontend access
    CORS(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)

    # Ensure data directory exists
    os.makedirs(app.config["DATA_FOLDER"], exist_ok=True)

    # Register Blueprints
    from app.auth import auth_bp
    from app.destinations import destinations_bp
    from app.recommendations import recommendations_bp
    from app.itineraries import itineraries_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(destinations_bp)
    app.register_blueprint(recommendations_bp)
    app.register_blueprint(itineraries_bp)

    # Root route for browser access
    @app.route("/", methods=["GET"])
    def index():
        """Root endpoint returning a simple service status message."""
        return api_response(
            True,
            "GlobeTrotter API is running",
            {
                "status": "OK",
                "message": "Use /health or the API endpoints to interact with the service."
            },
            status_code=200
        )

    # Health check route
    @app.route("/health", methods=["GET"])
    def health_check():
        """Health check endpoint to verify backend operational status."""
        return api_response(True, "OK", {"status": "OK"}, status_code=200)

    logger.info("GlobeTrotter Flask application initialized successfully.")
    return app
