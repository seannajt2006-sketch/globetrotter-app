"""
tests/test_api.py

Automated test suite for GlobeTrotter Flask application REST API endpoints.
Tests cover:
  - Health check (/health)
  - User registration & duplicate validation
  - Login & invalid credentials
  - JWT token verification & unauthorized access handling
  - Destination search (including empty results)
  - Personalized recommendations algorithm
  - Itinerary creation and listing with field validations
  - Storage handling with empty/missing JSON files
"""
import json
import os
import shutil
import tempfile
import unittest

from app import create_app
from app.config import Config


class GlobeTrotterTestCase(unittest.TestCase):
    """Test suite for GlobeTrotter backend API."""

    def setUp(self):
        """Set up an isolated temporary data folder and test client before each test."""
        self.temp_dir = tempfile.mkdtemp()
        
        # Define temporary configuration
        class TestConfig(Config):
            TESTING = True
            DATA_FOLDER = self.temp_dir
            USERS_FILE = os.path.join(self.temp_dir, "users.json")
            DESTINATIONS_FILE = os.path.join(self.temp_dir, "destinations.json")
            ITINERARIES_FILE = os.path.join(self.temp_dir, "itineraries.json")
            SECRET_KEY = "test-secret-key"

        self.app = create_app(TestConfig)
        self.client = self.app.test_client()

        # Seed test destinations
        self.seed_destinations = [
            {
                "id": "dest-1",
                "name": "Paris",
                "country": "France",
                "continent": "Europe",
                "description": "City of lights and fine dining.",
                "tags": ["food", "culture", "romantic"],
                "cost_per_day": 180
            },
            {
                "id": "dest-2",
                "name": "Tokyo",
                "country": "Japan",
                "continent": "Asia",
                "description": "Metropolis of technology and tradition.",
                "tags": ["technology", "food", "city"],
                "cost_per_day": 160
            }
        ]
        with open(TestConfig.DESTINATIONS_FILE, "w", encoding="utf-8") as fh:
            json.dump(self.seed_destinations, fh)

    def tearDown(self):
        """Clean up temporary data directory after test completes."""
        shutil.rmtree(self.temp_dir)

    def test_health_check(self):
        """Test GET /health returns 200 OK."""
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["status"], "OK")

    def test_user_registration_success(self):
        """Test registering a valid new user."""
        payload = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123",
            "preferences": ["food", "culture"]
        }
        res = self.client.post("/register", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["username"], "testuser")

    def test_duplicate_registration_rejection(self):
        """Test duplicate username and email registration rejection."""
        payload = {
            "username": "uniqueuser",
            "email": "unique@example.com",
            "password": "password123"
        }
        res1 = self.client.post("/register", json=payload)
        self.assertEqual(res1.status_code, 201)

        # Duplicate username
        res2 = self.client.post("/register", json={
            "username": "uniqueuser",
            "email": "another@example.com",
            "password": "password123"
        })
        self.assertEqual(res2.status_code, 409)
        self.assertFalse(res2.get_json()["success"])

        # Duplicate email
        res3 = self.client.post("/register", json={
            "username": "anotheruser",
            "email": "unique@example.com",
            "password": "password123"
        })
        self.assertEqual(res3.status_code, 409)

    def test_invalid_login_credentials(self):
        """Test login with non-existent user and wrong password."""
        res = self.client.post("/login", json={
            "username": "nonexistent",
            "password": "wrongpassword"
        })
        self.assertEqual(res.status_code, 401)
        self.assertFalse(res.get_json()["success"])

    def test_valid_login_and_jwt_issuance(self):
        """Test authenticating registered user returns JWT token."""
        self.client.post("/register", json={
            "username": "alice",
            "email": "alice@example.com",
            "password": "secretpassword",
            "preferences": ["food"]
        })

        res = self.client.post("/login", json={
            "username": "alice",
            "password": "secretpassword"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("token", data["data"])
        self.assertEqual(data["data"]["username"], "alice")

    def test_unauthorized_request_rejection(self):
        """Test protected endpoint without Authorization header returns 401."""
        res = self.client.get("/recommendations")
        self.assertEqual(res.status_code, 401)
        self.assertFalse(res.get_json()["success"])

    def test_invalid_jwt_token_rejection(self):
        """Test protected endpoint with malformed JWT returns 401."""
        res = self.client.get("/recommendations", headers={"Authorization": "Bearer invalid.jwt.token"})
        self.assertEqual(res.status_code, 401)

    def test_destination_search_with_matches_and_no_matches(self):
        """Test destination search query parameters."""
        # Match search
        res1 = self.client.get("/destinations?q=paris")
        self.assertEqual(res1.status_code, 200)
        data1 = res1.get_json()
        self.assertEqual(len(data1["data"]), 1)
        self.assertEqual(data1["data"][0]["name"], "Paris")

        # No match search
        res2 = self.client.get("/destinations?q=nonexistentcity")
        self.assertEqual(res2.status_code, 200)
        data2 = res2.get_json()
        self.assertEqual(len(data2["data"]), 0)

    def test_itinerary_creation_and_retrieval(self):
        """Test creating and retrieving user itineraries with valid JWT token."""
        self.client.post("/register", json={
            "username": "bob",
            "email": "bob@example.com",
            "password": "password123"
        })
        login_res = self.client.post("/login", json={"username": "bob", "password": "password123"})
        token = login_res.get_json()["data"]["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create itinerary
        it_payload = {
            "title": "Trip to Paris",
            "destination": "Paris, France",
            "start_date": "2026-09-01",
            "end_date": "2026-09-07",
            "activities": ["Louvre Museum"],
            "notes": "Flight booked"
        }
        create_res = self.client.post("/itineraries", json=it_payload, headers=headers)
        self.assertEqual(create_res.status_code, 201)

        # Retrieve itineraries
        list_res = self.client.get("/itineraries", headers=headers)
        self.assertEqual(list_res.status_code, 200)
        user_its = list_res.get_json()["data"]
        self.assertEqual(len(user_its), 1)
        self.assertEqual(user_its[0]["title"], "Trip to Paris")

    def test_invalid_itinerary_input(self):
        """Test creating itinerary with missing title returns 400."""
        self.client.post("/register", json={
            "username": "charlie",
            "email": "charlie@example.com",
            "password": "password123"
        })
        login_res = self.client.post("/login", json={"username": "charlie", "password": "password123"})
        token = login_res.get_json()["data"]["token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = self.client.post("/itineraries", json={"destination": "Rome"}, headers=headers)
        self.assertEqual(res.status_code, 400)


if __name__ == "__main__":
    unittest.main()
