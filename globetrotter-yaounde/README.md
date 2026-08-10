# GlobeTrotter — Smart Travel Assistant Application

GlobeTrotter is a monolithic Flask application for a travel assistant featuring a mobile-first responsive React frontend powered by Vite. Phase 1 intentionally uses JSON files for lightweight persistent data storage (`users.json`, `itineraries.json`, `destinations.json`) without requiring external database services.

---

## 🏗️ Project Architecture & Folder Structure

### Backend Architecture
The backend is built with **Flask (Python 3.9)** following a clean modular architecture:
- **Application Factory Pattern** (`create_app`) for Blueprint registration, CORS configuration, and logging setup.
- **Config module** (`app/config.py`) loading environment variables.
- **Storage module** (`app/storage.py`) providing atomic JSON file reading and writing.
- **Models module** (`app/models.py`) defining entity schemas and validation queries.
- **Utils module** (`app/utils.py`) containing the `@token_required` JWT decorator and standard `api_response` format.
- **Flask Blueprints**:
  - `auth_bp` (`app/auth.py`): Registration, login, and JWT issuance.
  - `destinations_bp` (`app/destinations.py`): Search catalogue with filters.
  - `recommendations_bp` (`app/recommendations.py`): Preference-based recommendation engine.
  - `itineraries_bp` (`app/itineraries.py`): Itinerary planner and viewer.

### Project Layout
```
/globetrotter-app
├── app/
│   ├── __init__.py          # Flask app factory, CORS & /health endpoint
│   ├── config.py            # Environment variables & configuration
│   ├── storage.py           # Reusable JSON file I/O operations
│   ├── models.py            # Entity models & schema validation
│   ├── utils.py            # JWT decorator, response envelope & validators
│   ├── auth.py             # POST /register, POST /login
│   ├── destinations.py     # GET /destinations
│   ├── recommendations.py  # GET /recommendations
│   ├── itineraries.py      # POST /itineraries, GET /itineraries
│   └── main.py             # Server entry point
├── data/
│   ├── destinations.json   # Seed travel catalogue dataset
│   ├── users.json          # Registered users (git-ignored)
│   └── itineraries.json    # Created itineraries (git-ignored)
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Search, Recommendations, Itineraries, Auth
│   │   ├── App.jsx         # Main React SPA component & state management
│   │   ├── main.jsx        # React DOM entry point
│   │   └── index.css       # Mobile-first CSS design system
│   ├── index.html          # HTML entry point with meta viewport
│   ├── vite.config.js      # Vite dev server & proxy settings
│   ├── nginx.conf          # Production Nginx reverse proxy configuration
│   ├── Dockerfile          # Multi-stage Node + Nginx image
│   └── package.json        # Dependencies (React, Vite, Lucide-React)
├── tests/
│   ├── __init__.py
│   └── test_api.py         # Automated API test suite
├── Dockerfile              # Backend Python 3.9-slim Dockerfile
├── docker-compose.yml      # Orchestrates backend + frontend containers
├── requirements.txt        # Flask, PyJWT, Werkzeug, Flask-CORS
└── README.md               # Project documentation
```

---

## 📡 Consistent API Response Format

All REST API endpoints return a standardized JSON response envelope:

### Successful Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response (`400 Bad Request`, `401 Unauthorized`, `409 Conflict`)
```json
{
  "success": false,
  "message": "Detailed error description"
}
```

---

## 📑 API Endpoint Documentation

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Backend health check status |
| `POST` | `/register` | Public | Register a new user with email & preferences |
| `POST` | `/login` | Public | Authenticate user & return JWT token |
| `GET` | `/destinations` | Public | Search destinations by keyword, tag, continent, cost |
| `GET` | `/recommendations` | JWT Bearer | Personalized recommendations based on tags |
| `POST` | `/itineraries` | JWT Bearer | Create a new trip itinerary |
| `GET` | `/itineraries` | JWT Bearer | List all itineraries for logged-in user |

---

## 🔑 JWT Authentication

Endpoints requiring authentication accept a signed JSON Web Token (JWT) passed in the `Authorization` HTTP header:
```http
Authorization: Bearer <YOUR_JWT_TOKEN>
```
Tokens are valid for **24 hours** by default.

---

## 💻 Local Development Setup

### 1. Prerequisites
- Python 3.9+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to project root
cd globetrotter-app

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start Flask backend server (runs on http://localhost:5000)
python app/main.py
```

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to frontend folder
cd globetrotter-app/frontend

# Install Node dependencies
npm install

# Start Vite dev server (runs on http://localhost:5173 with proxy to port 5000)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🐳 Docker & Docker Compose Setup

Run the entire monolithic stack with a single command using Docker Compose:

```bash
cd globetrotter-app

# Build and start backend and frontend containers
docker-compose up --build
```

- **Frontend App**: Accessible at `http://localhost` (Port 80)
- **Backend API**: Accessible at `http://localhost:5000`

To stop the containers:
```bash
docker-compose down
```

---

## 🧪 Running Automated Tests

Run the backend test suite:
```bash
cd globetrotter-app
python -m unittest discover tests
```

---

## 📝 Example cURL API Requests

### 1. Register User
```bash
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "sarah",
    "email": "sarah@example.com",
    "password": "secretpassword123",
    "preferences": ["beach", "food", "culture"]
  }'
```

### 2. User Login
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "sarah",
    "password": "secretpassword123"
  }'
```

### 3. Search Destinations
```bash
curl -X GET "http://localhost:5000/destinations?tag=beach&max_cost=150"
```

### 4. Get Recommendations (Authenticated)
```bash
curl -X GET http://localhost:5000/recommendations \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### 5. Create Itinerary (Authenticated)
```bash
curl -X POST http://localhost:5000/itineraries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "title": "Summer in Bali",
    "destination": "Bali, Indonesia",
    "start_date": "2026-07-01",
    "end_date": "2026-07-14",
    "activities": ["Scuba diving", "Visit Ubud Rice Terraces"],
    "notes": "Book airport shuttle in advance"
  }'
```

---

## 🚀 Future Roadmap: Database Migration

In Phase 2, the JSON storage layer (`app/storage.py`) can be seamlessly replaced with an ORM like **Flask-SQLAlchemy** connected to a **PostgreSQL** or **MySQL** database:
1. Replace `storage.py` methods with SQLAlchemy DB session queries.
2. Define SQLAlchemy models matching `UserModel`, `DestinationModel`, and `ItineraryModel`.
3. Add Alembic database migrations.
4. Update `docker-compose.yml` to launch a `postgres:15` service container.
