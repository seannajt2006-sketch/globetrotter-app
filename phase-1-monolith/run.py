#!/usr/bin/env python3
"""
Yaounde Places — One-Command Launcher

Usage:
    python3 run.py

This starts the Flask server (backend + frontend) on port 5000.
Open your browser to http://localhost:5000

The frontend is already built and bundled — no need for npm or separate servers.
"""
import os
import sys
from app import create_app

app = create_app()

if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("  Yaounde Places Guide")
    print("  Open your browser to http://localhost:5000")
    print("=" * 50 + "\n")
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
