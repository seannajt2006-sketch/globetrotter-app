"""
app/__init__.py
Flask application factory.
Configures logging, registers Blueprints, serves the React frontend,
and defines the /health route.
"""
import logging
import os
from flask import Flask, send_from_directory
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

    # Locate the frontend build directory
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    STATIC_DIR = os.path.join(BASE_DIR, "frontend", "dist")

    app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="")
    app.config.from_object(config_class)

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

    # Health check route
    @app.route("/health", methods=["GET"])
    def health_check():
        """Health check endpoint to verify backend operational status."""
        return api_response(True, "OK", {"status": "OK"}, status_code=200)

    # Serve the React SPA for all non-API routes
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_spa(path):
        """Serve the React built frontend (SPA)."""
        if path and os.path.exists(os.path.join(STATIC_DIR, path)):
            return send_from_directory(STATIC_DIR, path)
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_path):
            return send_from_directory(STATIC_DIR, "index.html")
        return api_response(False, "Frontend not built. Run: cd frontend && npm run build", status_code=404)

    logger.info("Yaounde Places application initialized successfully.")
    return app
