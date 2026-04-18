# VenueNexus Backend

## Running Locally

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Install developer test dependencies:

```bash
pip install -r requirements-dev.txt
```

3. Set the API key:

```bash
export API_KEY=venue-nexus-demo
```

4. Run the service:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

5. Browse API docs:

```text
http://localhost:8000/docs
```

## Edge and stream observability

The backend now includes lightweight stub services for edge ingest and stream processing metrics. These are surfaced through `/health/metrics` for readiness and monitoring.

### New operational routes

- `POST /edge/event` — receive edge telemetry from cameras, scanners, or sensors
- `GET /edge/nodes` — list edge nodes and active status
- `POST /stream/event` — enqueue an event for stream processing
- `GET /stream/pending` — inspect the queue of pending stream events
- `POST /stream/process` — process the next queued event

These endpoints are protected with the same `x-api-key` operator auth.

3. Run the app:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

4. Open the docs:

```text
http://localhost:8000/docs
```

## Authentication

All primary API routes under `/status`, `/simulation`, `/nudge`, `/agent`, and `/kpi` require the `x-api-key` header.

Example:

```http
GET /status/ HTTP/1.1
Host: localhost:8000
x-api-key: venue-nexus-demo
```

## Health checks

The `/health/` and `/health/metrics` endpoints remain accessible without authentication for monitoring and readiness probes.
