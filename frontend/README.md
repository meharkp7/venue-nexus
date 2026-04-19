# VenueNexus Frontend

React + Vite dashboard for the VenueNexus venue intelligence system.

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# Opens at http://localhost:5173
```

Make sure the FastAPI backend is running on port 8000 first:
```bash
cd backend
cp .env.example .env
uvicorn app.main:app --reload
```

## Stack
- **React 18** — UI
- **Vite** — dev server + bundler (proxies /api → localhost:8000)
- **Recharts** — density trend chart
- **Lucide React** — icons

## Features
- Premium 2D venue floorplan viewer with real zones and corridor flow
- Searchable zone jump box and breadcrumb navigation
- Zoom/pan inspection with minimap jump navigation and snap-to-zone zoom
- Animated phase presets for ingress, halftime, and egress
- Floating inspector drawer anchored to the selected zone
- Amenities and infrastructure overlays: suites, clubs, merch, restrooms, first-aid, stairs, vomitories
- Real-time congestion alerts with severity levels
- Attendee nudge messages with incentives
- Exit routing recommendations
- Density trend chart
- Sortable zone status table
- Agent console (Vertex AI or rule-based fallback)
- Simulation controls: play, pause, step, reset

## Important source links

- Floorplan component: [src/components/VenueMap.jsx](./src/components/VenueMap.jsx)
- Floorplan geometry and mapping: [src/utils/venueFloorplan.js](./src/utils/venueFloorplan.js)
- Main dashboard composition: [src/App.jsx](./src/App.jsx)
- Simulation hook: [src/hooks/useSimulation.js](./src/hooks/useSimulation.js)
- API client: [src/services/api.js](./src/services/api.js)

## Build for production
```bash
npm run build
# Output in dist/
```

## Docker Compose
A local Docker Compose setup is available from the repository root.

```bash
docker compose up --build
```

The backend will be reachable at `http://localhost:8000` and the frontend at `http://localhost:5173`.
