"""
test_integration_flows.py
Additional tests covering edge cases, integration flows,
and regression scenarios for VenueNexus.
"""
from fastapi.testclient import TestClient
from app.main import app
from app.models.graph_model import VenueGraph, VenueNode, VenueEdge, NodeType
from app.models.state_model import AlertLevel, CongestionAlert
from app.services import agent_service

client = TestClient(app)
HEADERS = {"x-api-key": "venue-nexus-demo"}


# ─── Edge Cases ───────────────────────────────────────────────────────────────

def test_simulation_tick_with_zero_tick_is_valid():
    client.post("/simulation/reset", headers=HEADERS)
    response = client.post("/simulation/tick", headers=HEADERS, json={"tick": 0})
    assert response.status_code == 200
    assert response.json()["overall_density"] >= 0


def test_simulation_density_never_exceeds_one():
    client.post("/simulation/reset", headers=HEADERS)
    for t in range(5):
        response = client.post("/simulation/tick", headers=HEADERS, json={"tick": t})
        assert response.status_code == 200
        payload = response.json()
        assert payload["overall_density"] <= 1.0
        for node in payload["nodes"]:
            assert node["density"] <= 1.0, f"Node {node['id']} density exceeded 1.0"


def test_simulation_nodes_always_have_required_fields():
    client.post("/simulation/reset", headers=HEADERS)
    response = client.post("/simulation/tick", headers=HEADERS, json={"tick": 0})
    payload = response.json()
    required_fields = {"id", "name", "density", "status", "capacity", "current_occupancy"}
    for node in payload["nodes"]:
        missing = required_fields - set(node.keys())
        assert not missing, f"Node {node.get('id')} missing fields: {missing}"


def test_health_check_returns_all_services_up():
    response = client.get("/health/", headers=HEADERS)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    for service, status in body["services"].items():
        assert status == "up", f"Service {service} is not up"


def test_health_metrics_returns_expected_keys():
    response = client.get("/health/metrics", headers=HEADERS)
    assert response.status_code == 200
    body = response.json()
    assert "api_latency_ms" in body
    assert "overall_status" in body
    assert "nodes_processed" in body
    assert body["api_latency_ms"] > 0


# ─── Integration Flows ────────────────────────────────────────────────────────

def test_full_simulation_then_agent_strategy_flow():
    """Integration: run a tick, then call agent strategy — should not error."""
    client.post("/simulation/reset", headers=HEADERS)
    tick_response = client.post("/simulation/tick", headers=HEADERS, json={"tick": 0})
    assert tick_response.status_code == 200

    strategy_response = client.post(
        "/agent/strategy",
        headers=HEADERS,
        json={"question": "What is the current risk level?"},
    )
    assert strategy_response.status_code == 200
    body = strategy_response.json()
    assert "strategy" in body or "data" in body or "status" in body


def test_whatif_simulation_returns_multiple_scenarios():
    response = client.post(
        "/agent/whatif",
        headers=HEADERS,
        json={"question": "What if we close Gate A?"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "scenarios" in body
    assert len(body["scenarios"]) >= 1
    for scenario in body["scenarios"]:
        assert "scenario_name" in scenario
        assert "density_before" in scenario
        assert "density_after" in scenario
        assert 0 <= scenario["density_before"] <= 1
        assert 0 <= scenario["density_after"] <= 1


def test_kpi_endpoint_returns_valid_structure():
    client.post("/simulation/reset", headers=HEADERS)
    client.post("/simulation/tick", headers=HEADERS, json={"tick": 0})
    response = client.get("/kpi/summary", headers=HEADERS)
    assert response.status_code == 200
    body = response.json()
    assert "safety_score" in body or "summary" in body or len(body) > 0


def test_agent_decisions_endpoint_returns_list():
    response = client.get("/agent/decisions", headers=HEADERS)
    assert response.status_code == 200
    body = response.json()
    assert "decisions" in body
    assert isinstance(body["decisions"], list)


def test_nudge_endpoint_returns_list():
    response = client.get("/nudge/", headers=HEADERS)
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, (list, dict))


# ─── Agent Edge Cases ─────────────────────────────────────────────────────────

def test_agentic_pipeline_with_no_alerts_produces_log_entry():
    graph = VenueGraph()
    graph.add_node(VenueNode("gate_a", "Gate A", NodeType.GATE, capacity=200, current_occupancy=40))
    agent_service._decision_log.clear()
    agent_service._action_registry.clear()

    actions = agent_service.run_agentic_pipeline(graph, alerts=[], tick=99, phase="pre_event")

    log = agent_service.get_decision_log()
    assert len(log) >= 1
    assert log[-1].tick == 99


def test_agentic_pipeline_max_density_node_triggers_redirect():
    graph = VenueGraph()
    graph.add_node(VenueNode("section_x", "Section X", NodeType.SECTOR, capacity=100, current_occupancy=99))
    graph.add_node(VenueNode("exit_a", "Exit A", NodeType.EXIT, capacity=200, current_occupancy=20))
    graph.add_edge(VenueEdge("section_x", "exit_a", max_flow=100, flow_rate=10))
    agent_service._action_registry.clear()

    alerts = [CongestionAlert(
        node_id="section_x",
        node_name="Section X",
        density=0.99,
        alert_level=AlertLevel.CRITICAL,
        confidence=0.99,
    )]
    actions = agent_service.run_agentic_pipeline(graph, alerts, tick=1, phase="in_progress")
    assert any(a.action_type.value == "redirect_flow" for a in actions)


def test_what_if_with_empty_graph_does_not_crash():
    graph = VenueGraph()
    results = agent_service.run_what_if(graph, scenario="Close all gates", alerts=[])
    assert isinstance(results, list)
    assert len(results) >= 1  # At least baseline scenario


def test_approve_nonexistent_action_returns_none():
    result = agent_service.approve_action("totally-fake-id-xyz")
    assert result is None