# GlobeTrotter — Smart Travel Assistant (Phase 2 Microservices)

GlobeTrotter has evolved from a Phase 1 monolithic architecture into a **Phase 2 Event-Driven Microservices Architecture**. The application is decomposed into three independent Flask microservices, an API Gateway, RabbitMQ message broker for asynchronous events, and a modern React frontend featuring interactive Leaflet map visualization for Yaoundé destinations and itinerary routes.

---

## 🏗️ Architecture & Component Breakdown

```
                        +----------------------+
                        |  React Frontend      |
                        |  (Vite / Leaflet)    |
                        +----------+-----------+
                                   |
                                   v  (HTTP / Port 5000)
                        +----------------------+
                        |     API Gateway      |
                        |   (Flask Reverse    |
                        |        Proxy)        |
                        +----+--------+--------+
                             |        |
        +--------------------+        +--------------------+
        |                             |                    |
        v                             v                    v
+---------------+             +---------------+    +------------------------+
| User Service  |             |  Itinerary    |    | Recommendation Service |
| (Port 5001)   |             |   Service     |    | (Port 5003)            |
| - users.json  |             | (Port 5002)   |    | - destinations.json    |
+-------+-------+             | - itineraries |    +-----------+------------+
        ^                     +-------+-------+                ^
        |                             |                        |
        +------- REST (Sync) ---------+-- REST (Sync) ---------+
                                      |
                                  RabbitMQ (Async Event)
                                  "itinerary_created"
                                      |
                                      +------------------------+
```

### 1. API Gateway (`/api-gateway`)
- **Port:** `5000`
- **Role:** Single unified entry point for all client requests. Routes incoming HTTP traffic to downstream services based on path (`/users/*`, `/itineraries/*`, `/recommendations/*`, `/destinations/*`).
- **Health Check:** Aggregates health status across all downstream services at `/health`.

### 2. User Service (`/services/user-service`)
- **Port:** `5001`
- **Data Store:** `data/users.json`
- **Role:** Handles user registration, authentication (JWT issuance), user profiles, and preference tags.

### 3. Itinerary Service (`/services/itinerary-service`)
- **Port:** `5002`
- **Data Store:** `data/itineraries.json`
- **Role:** Manages trip creation and user itineraries. Publishes an `itinerary_created` domain event to **RabbitMQ** whenever a new trip is saved.

### 4. Recommendation Service (`/services/recommendation-service`)
- **Port:** `5003`
- **Data Store:** `data/destinations.json` (seeded with lat/lng coordinates in Yaoundé)
- **Role:** Generates personalized travel recommendations and supports place search.
  - **Synchronous REST:** Performs HTTP requests to User Service (profile/preferences) and Itinerary Service (trip history).
  - **Asynchronous Consumer:** Listens in a background daemon thread for `itinerary_created` events from RabbitMQ to update metrics and caches.

### 5. React Frontend (`/frontend`)
- **Port:** `80` (or `5173` in local dev mode)
- **Role:** Mobile-first responsive React app built with Vite and Lucide icons. Includes **Leaflet interactive maps** to visualize destination pins and plot itinerary route lines across Yaoundé.

---

## 📁 Project Directory Structure

```
phase-2-microservices/
├── api-gateway/
│   ├── app.py              # Flask reverse-proxy gateway
│   ├── Dockerfile
│   └── requirements.txt
├── services/
│   ├── user-service/
│   │   ├── app.py          # /users/register, /users/login, /users/<id>
│   │   ├── models.py       # UserModel & atomic JSON file I/O
│   │   ├── utils.py        # Password hashing & JWT helpers
│   │   ├── data/users.json
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── itinerary-service/
│   │   ├── app.py          # /itineraries endpoints
│   │   ├── models.py       # ItineraryModel & storage
│   │   ├── messaging.py    # Pika RabbitMQ event producer
│   │   ├── data/itineraries.json
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── recommendation-service/
│       ├── app.py          # /recommendations & /destinations endpoints
│       ├── models.py       # DestinationModel & filters
│       ├── consumer.py      # Pika RabbitMQ event consumer
│       ├── data/destinations.json # Seed places with lat/lng coordinates
│       ├── Dockerfile
│       └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapComponent.jsx     # Leaflet interactive map with markers & routes
│   │   │   ├── SearchDestinations.jsx
│   │   │   ├── Recommendations.jsx
│   │   │   ├── ViewItineraries.jsx
│   │   │   ├── CreateItinerary.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css       # Responsive dark-mode styling system
│   ├── index.html          # HTML entry point with Leaflet stylesheet
│   ├── vite.config.js
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml       # Orchestrates all 6 services + RabbitMQ
├── .gitignore
└── README.md
```

---

## 🚀 Running the Application with Docker Compose

Ensure Docker Engine and Docker Compose are installed on your machine.

### 1. Build and Start All Containers
From this directory (`phase-2-microservices/`), run:
```bash
cd phase-2-microservices
docker-compose up --build
```

This single command starts:
1. `rabbitmq` (Port `5672` / Management UI `15672`)
2. `user-service` (Port `5001`)
3. `itinerary-service` (Port `5002`)
4. `recommendation-service` (Port `5003`)
5. `api-gateway` (Port `5000`)
6. `frontend` (Port `80`)

### 2. Access the Application
- **React Frontend:** Open `http://localhost` in your web browser.
- **API Gateway:** `http://localhost:5000` (e.g. `http://localhost:5000/health`)
- **RabbitMQ Management Dashboard:** `http://localhost:15672` (Username: `guest`, Password: `guest`)

### 3. Stop Containers
```bash
docker-compose down
```

---

## 💻 Local Development Setup (Without Docker)

If running microservices individually in Python virtual environments:

```bash
# Start User Service
cd services/user-service
python app.py  # Runs on http://localhost:5001

# Start Itinerary Service
cd services/itinerary-service
python app.py  # Runs on http://localhost:5002

# Start Recommendation Service
cd services/recommendation-service
python app.py  # Runs on http://localhost:5003

# Start API Gateway
cd api-gateway
python app.py  # Runs on http://localhost:5000

# Start Frontend Dev Server
cd frontend
npm install
npm run dev    # Runs on http://localhost:5173
```

---

## ⚠️ Phase 2 Known Architecture Challenges & Trade-offs

Migrating from a monolithic application to a microservices architecture introduces important distributed systems challenges:

### 1. Network Latency & Inter-Service Overhead
- **Monolith:** Function calls occur in memory within microseconds.
- **Microservices:** Synchronous REST calls between services (e.g., Recommendation Service requesting user data from User Service) introduce HTTP network serialization overhead, DNS lookups, and TCP latency.
- **Mitigation:** Implement caching layers (e.g., Redis) or combine required payloads into event notifications.

### 2. Data Consistency & Eventual Consistency
- **Monolith:** Can enforce ACID transactions using a single database.
- **Microservices:** Database per service means global cross-service ACID transactions are unavailable without complex patterns (Saga Pattern or Two-Phase Commit).
- **Mitigation:** Embrace **eventual consistency**. For example, when an itinerary is created, Recommendation Service is notified asynchronously via RabbitMQ. The recommendation engine updates its cache within milliseconds of receiving the event rather than blocking the user's HTTP request.

### 3. Service Discovery & Configuration Management
- **Monolith:** Single code repository and single process execution.
- **Microservices:** Hardcoded IP addresses fail when containers restart or scale dynamically.
- **Mitigation:** Docker Compose uses internal container DNS (`http://user-service:5001`). In production Kubernetes setups, toolings like Consul or Kubernetes Service Discovery handle dynamic IP resolution.

### 4. Fault Tolerance & Cascading Failures
- **Monolith:** If a process crashes, the entire app is affected, but within a process, calls don't time out over network sockets.
- **Microservices:** If User Service is down, Recommendation Service calls could hang or fail, causing cascading failure across the API Gateway.
- **Mitigation:** Downstream REST calls feature explicit connection timeouts, graceful error fallbacks (e.g. returning non-personalized recommendations if User Service is unreachable), and RabbitMQ retry reconnection loops. Circuit breakers (e.g., Hystrix or Resilience4j patterns) can be added in Phase 3.
