# GlobeTrotter — Smart Travel Assistant

This repository tracks the evolution of GlobeTrotter across two architecture phases of a distributed-systems capstone project: a **Phase 1 monolith** and a **Phase 2 event-driven microservices** rebuild.

## 📁 Repository Layout

```
globetrotter-app/
├── phase-1-monolith/        # Phase 1: single Flask app, JSON file storage
└── phase-2-microservices/   # Phase 2: API Gateway + 3 Flask microservices + RabbitMQ
```

## Phase 1 — The Monolith ([`phase-1-monolith/`](phase-1-monolith/))

A single Flask application handling registration, login, destination search, recommendations, and itineraries, backed by JSON files (no database). See [phase-1-monolith/README.md](phase-1-monolith/README.md) for setup, API docs, and architecture details.

```bash
cd phase-1-monolith
docker-compose up --build
```

## Phase 2 — Microservices ([`phase-2-microservices/`](phase-2-microservices/))

The monolith decomposed into independent **User**, **Itinerary**, and **Recommendation** services behind an **API Gateway**, communicating synchronously over REST and asynchronously via **RabbitMQ**. See [phase-2-microservices/README.md](phase-2-microservices/README.md) for the full architecture diagram, service breakdown, and setup.

```bash
cd phase-2-microservices
docker-compose up --build
```

## Why Two Phases?

| Aspect | Phase 1 (Monolith) | Phase 2 (Microservices) |
| :--- | :--- | :--- |
| Deployment | One process/container | Independent services + gateway |
| Data | Shared JSON files | One JSON store per service |
| Communication | In-process function calls | REST (sync) + RabbitMQ (async) |
| Scaling | Vertical only | Per-service, horizontal |
| Failure impact | Whole app affected | Isolated per service |

Each phase is fully self-contained with its own `docker-compose.yml`, Dockerfiles, and README — run either one independently from its own directory.
