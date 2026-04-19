from fastapi.testclient import TestClient

from app.main import app
from app.models.graph_model import VenueGraph
from app.services.scenario_service import scenario_service


client = TestClient(app)


def test_status_node_invalid_id_returns_error_payload():
    response = client.get("/status/node/not-a-real-zone", headers={"x-api-key": "venue-nexus-demo"})

    assert response.status_code == 200
    assert response.json()["error"] == "Node 'not-a-real-zone' not found"


def test_empty_graph_summary_is_stable():
    graph = VenueGraph()

    assert graph.summary() == {
        "total_nodes": 0,
        "total_edges": 0,
        "congested_nodes": [],
        "overall_density": 0.0,
    }


def test_scenario_service_handles_invalid_timestamp_values():
    scenario = {
        "graph_config": {
            "nodes": [
                {"id": "concourse_test", "x": 50, "y": 50, "node_type": "concourse", "capacity": 100, "density": 0.75}
            ],
            "edges": [],
        },
        "events": [
            {"type": "congestion_spike", "node_id": "concourse_test", "severity": "high", "timestamp": "bad-timestamp"}
        ],
    }

    alerts = scenario_service.generate_alerts_from_scenario(scenario)

    assert alerts
    assert alerts[0].node_id == "concourse_test"
    assert alerts[0].alert_level.value == "high"

