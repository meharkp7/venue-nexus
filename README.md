# VenueNexus

VenueNexus is an AI-powered venue intelligence prototype with a React dashboard, FastAPI backend, and containerized deployment support.

The dashboard now centers on a premium 2D floorplan viewer instead of a node graph, with live zone occupancy, corridor flow, phase presets, zoom/pan inspection, minimap navigation, search-based zone lookup, and a floating inspector for operators.

## What’s implemented

- FastAPI backend with `/status`, `/simulation`, `/agent`, `/nudge`, `/kpi`, and `/health`
- React + Vite frontend with a map-first operator dashboard
- Floorplan-based venue viewer with zones, corridors, sensors, amenities, and circulation infrastructure
- Zoom/pan inspection, minimap jump navigation, snap-to-zone zoom, and searchable zone lookup
- Animated phase presets for ingress, halftime, and egress narratives
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

## Key links

- Frontend app docs: [frontend/README.md](./frontend/README.md)
- Architecture notes: [docs/architecture.md](./docs/architecture.md)
- Demo script: [docs/demo-script.md](./docs/demo-script.md)
- Pitch notes: [docs/pitch.md](./docs/pitch.md)
- Frontend floorplan map: [frontend/src/components/VenueMap.jsx](./frontend/src/components/VenueMap.jsx)
- Frontend floorplan data model: [frontend/src/utils/venueFloorplan.js](./frontend/src/utils/venueFloorplan.js)
- Main dashboard shell: [frontend/src/App.jsx](./frontend/src/App.jsx)
- Backend simulation service: [backend/app/services/simulation_service.py](./backend/app/services/simulation_service.py)
- Backend scenario loader: [backend/app/services/scenario_service.py](./backend/app/services/scenario_service.py)

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

## Frontend highlights

- Venue floorplan viewer with real zone polygons instead of floating graph nodes
- Seating bowl and concourse layer toggles
- Suites, clubs, merch, restrooms, first-aid, hospitality, stairs, and vomitories
- Floating zone inspector with recommended actions and sensor cards
- Search and breadcrumb navigation for zone lookup such as `101A`, `East Club Walk`, or `Gate C`
- Minimap plus snap-to-zone zoom for demo-friendly navigation
