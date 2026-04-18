# VenueNexus Frontend

React + Vite dashboard for the VenueNexus crowd management system.

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
- Live venue map with node density visualization
- Real-time congestion alerts with severity levels
- Attendee nudge messages with incentives
- Exit routing recommendations
- Density trend chart
- Sortable node status table
- Agent console (Vertex AI or rule-based fallback)
- Simulation controls: play, pause, step, reset

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
