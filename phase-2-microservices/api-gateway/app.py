"""
api-gateway/app.py

GlobeTrotter API Gateway Service.
Acts as the single reverse-proxy entry point for client requests, forwarding traffic
to the appropriate downstream microservices based on request path.
"""
import os
import logging
import requests
from flask import Flask, request, Response, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] API-Gateway: %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Service endpoints configuration (supports environment variables for Docker / Kubernetes)
USER_SERVICE_URL = os.environ.get("USER_SERVICE_URL", "http://user-service:5001")
ITINERARY_SERVICE_URL = os.environ.get("ITINERARY_SERVICE_URL", "http://itinerary-service:5002")
RECOMMENDATION_SERVICE_URL = os.environ.get("RECOMMENDATION_SERVICE_URL", "http://recommendation-service:5003")
COMMUNITY_SERVICE_URL = os.environ.get("COMMUNITY_SERVICE_URL", "http://community-service:5004")


def proxy_request(target_url: str):
    """Helper function to proxy HTTP requests to a downstream microservice."""
    headers = {key: value for key, value in request.headers if key.lower() != "host"}
    
    try:
        resp = requests.request(
            method=request.method,
            url=target_url,
            headers=headers,
            data=request.get_data(),
            params=request.args,
            cookies=request.cookies,
            allow_redirects=False,
            timeout=10
        )
        
        excluded_headers = ["content-encoding", "content-length", "transfer-encoding", "connection"]
        response_headers = [(name, value) for (name, value) in resp.raw.headers.items() if name.lower() not in excluded_headers]
        
        return Response(resp.content, resp.status_code, response_headers)
    except requests.exceptions.RequestException as err:
        logger.error(f"Gateway Error forwarding to {target_url}: {err}")
        return jsonify({
            "success": False,
            "message": f"Service unavailable: Unable to reach downstream service at {target_url}"
        }), 530


# User Service Routes
@app.route("/users", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE"])
@app.route("/users/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def user_service_proxy(path):
    target = f"{USER_SERVICE_URL}/users/{path}" if path else f"{USER_SERVICE_URL}/users"
    return proxy_request(target)

@app.route("/register", methods=["POST"])
def register_alias():
    """Alias route for frontend backwards-compatibility: /register -> /users/register"""
    return proxy_request(f"{USER_SERVICE_URL}/users/register")

@app.route("/login", methods=["POST"])
def login_alias():
    """Alias route for frontend backwards-compatibility: /login -> /users/login"""
    return proxy_request(f"{USER_SERVICE_URL}/users/login")


# Itinerary Service Routes
@app.route("/itineraries", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE"])
@app.route("/itineraries/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def itinerary_service_proxy(path):
    target = f"{ITINERARY_SERVICE_URL}/itineraries/{path}" if path else f"{ITINERARY_SERVICE_URL}/itineraries"
    return proxy_request(target)


# Recommendation & Destination Service Routes
@app.route("/recommendations", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE"])
@app.route("/recommendations/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def recommendation_service_proxy(path):
    target = f"{RECOMMENDATION_SERVICE_URL}/recommendations/{path}" if path else f"{RECOMMENDATION_SERVICE_URL}/recommendations"
    return proxy_request(target)

@app.route("/destinations", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE"])
@app.route("/destinations/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def destination_service_proxy(path):
    target = f"{RECOMMENDATION_SERVICE_URL}/destinations/{path}" if path else f"{RECOMMENDATION_SERVICE_URL}/destinations"
    return proxy_request(target)


# Community Service Routes (destination comments + global chat REST; Socket.IO bypasses the gateway)
@app.route("/comments", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE"])
@app.route("/comments/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def comments_service_proxy(path):
    target = f"{COMMUNITY_SERVICE_URL}/comments/{path}" if path else f"{COMMUNITY_SERVICE_URL}/comments"
    return proxy_request(target)

@app.route("/chat", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE"])
@app.route("/chat/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def chat_service_proxy(path):
    target = f"{COMMUNITY_SERVICE_URL}/chat/{path}" if path else f"{COMMUNITY_SERVICE_URL}/chat"
    return proxy_request(target)


# Health Check & Gateway Status
@app.route("/health", methods=["GET"])
def health_check():
    """Aggregated health check status of Gateway and downstream microservices."""
    services_status = {}
    
    for name, url in [("user-service", USER_SERVICE_URL), ("itinerary-service", ITINERARY_SERVICE_URL), ("recommendation-service", RECOMMENDATION_SERVICE_URL), ("community-service", COMMUNITY_SERVICE_URL)]:
        try:
            r = requests.get(f"{url}/health", timeout=3)
            services_status[name] = "healthy" if r.status_code == 200 else f"unhealthy ({r.status_code})"
        except Exception:
            services_status[name] = "unreachable"

    return jsonify({
        "success": True,
        "message": "API Gateway operational",
        "gateway_status": "healthy",
        "downstream_services": services_status
    }), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    logger.info(f"Starting API Gateway on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
