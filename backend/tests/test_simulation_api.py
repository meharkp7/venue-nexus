from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)
HEADERS = {"x-api-key": "venue-nexus-demo"}


def test_root_endpoint_exposes_capabilities():
    response = client.get("/")

    assert response.status_code == 200
    body = response.json()
    assert body["docs"] == "/docs"
    assert "Real-time crowd simulation" in body["capabilities"]


def test_simulation_tick_returns_expected_state_shape():
    reset_response = client.post("/simulation/reset", headers=HEADERS)
    assert reset_response.status_code == 200

    response = client.post("/simulation/tick", headers=HEADERS, json={"tick": 0})
    assert response.status_code == 200

    payload = response.json()
    assert "nodes" in payload
    assert "edges" in payload
    assert "overall_density" in payload
    assert "event_phase" in payload
    assert isinstance(payload["nodes"], list)
    assert isinstance(payload["edges"], list)
