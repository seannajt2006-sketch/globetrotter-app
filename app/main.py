"""
app/main.py

Main entry point to execute the GlobeTrotter Flask backend server.

Run locally:
    python app/main.py
"""
import os
import sys

# Ensure the project root is on sys.path when running app/main.py directly.
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = app.config.get("DEBUG", False)
    app.run(host="0.0.0.0", port=port, debug=debug)
