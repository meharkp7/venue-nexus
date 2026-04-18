# VenueNexus

VenueNexus is an AI-powered crowd management prototype with a React dashboard, FastAPI backend, and containerized deployment support.

## What’s implemented

- FastAPI backend with `/status`, `/simulation`, `/agent`, `/nudge`, `/kpi`, and `/health`
- React + Vite frontend with dashboard and operator controls
- API key authentication for protected operator routes
- Health and metrics endpoints for observability
- Docker and Docker Compose support for local deployment
- Basic stub services for edge ingest and stream processing metrics
- CI workflow for Python and frontend validation

## Quick start

```bash
cp .env.example .env
cd backend && pip install -r requirements.txt
cd frontend && npm install
cd ..
docker compose up --build
```

The backend is available at `http://localhost:8000` and the frontend at `http://localhost:5173`.

## Configuration

Copy the example env file and update values as needed:

```bash
cp .env.example .env
```

## Repo structure

- `backend/`: FastAPI service, business logic, auth, health, metrics
- `frontend/`: React dashboard and API client
- `docker-compose.yml`: local multi-service orchestration
- `docs/`: architecture and production-readiness notes
- `scripts/run_all.sh`: simple developer bootstrap script
- `.github/workflows/ci.yml`: CI validation for backend and frontend
