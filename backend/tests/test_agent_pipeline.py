from app.models.graph_model import VenueEdge, VenueGraph, VenueNode, NodeType
from app.models.state_model import AlertLevel, CongestionAlert
from app.services import agent_service


def build_test_graph():
    graph = VenueGraph()
    graph.add_node(VenueNode("concourse_n", "North Concourse", NodeType.CONCOURSE, capacity=100, current_occupancy=92))
    graph.add_node(VenueNode("concourse_e", "East Concourse", NodeType.CONCOURSE, capacity=100, current_occupancy=22))
    graph.add_edge(VenueEdge("concourse_n", "concourse_e", max_flow=100, flow_rate=45))
    return graph


def test_run_agentic_pipeline_generates_actions_for_critical_alert():
    graph = build_test_graph()
    agent_service._decision_log.clear()
    agent_service._action_registry.clear()

    alerts = [
        CongestionAlert(
            node_id="concourse_n",
            node_name="North Concourse",
            density=0.92,
            alert_level=AlertLevel.CRITICAL,
            confidence=0.94,
        )
    ]

    actions = agent_service.run_agentic_pipeline(graph, alerts, tick=3, phase="in_progress")

    assert actions
    assert any(action.action_type.value == "dispatch_staff" for action in actions)
    assert any(action.action_type.value == "redirect_flow" for action in actions)
    assert agent_service.get_decision_log()


def test_approve_and_execute_redirect_action_changes_graph_state():
    graph = build_test_graph()
    agent_service._decision_log.clear()
    agent_service._action_registry.clear()

    alerts = [
        CongestionAlert(
            node_id="concourse_n",
            node_name="North Concourse",
            density=0.88,
            alert_level=AlertLevel.HIGH,
            confidence=0.91,
        )
    ]
    actions = agent_service.run_agentic_pipeline(graph, alerts, tick=4, phase="in_progress")
    dispatch_action = next(action for action in actions if action.action_type.value == "dispatch_staff")

    assert dispatch_action.requires_approval is True
    approved = agent_service.approve_action(dispatch_action.id)
    executed = agent_service.execute_action(dispatch_action.id, graph)

    assert approved is not None
    assert executed is not None
    assert executed.executed is True

