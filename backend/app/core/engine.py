"""
engine.py
---------
Production-grade orchestration engine.

Pipeline per tick:
    simulate → record → predict → forecast → route → nudge → reason → kpi

One call to `run_tick()` advances the venue state by one time step
and returns a complete VenueState snapshot with:
  - Congestion alerts with confidence scores
  - Short-term density forecasts (5/15/30 min)
  - Multi-objective routing with cost breakdowns
  - Agentic structured actions
  - Business KPIs
"""

from datetime import datetime
from app.models.graph_model import VenueGraph
from app.models.state_model import (
    VenueState, NodeStatus, EdgeStatus, SimulationStep
)
from app.services import (
    simulation_service,
    prediction_service,
    routing_service,
    nudge_service,
    agent_service,
    kpi_service,
    scenario_service,
)


# In-memory venue graph (persists across ticks for the session)
_graph: VenueGraph = None
_current_tick: int = 0


def get_graph() -> VenueGraph:
    global _graph
    if _graph is None:
        reset()
    return _graph


def get_current_tick() -> int:
    return _current_tick


def reset():
    global _graph, _current_tick
    # Force scenario rotation for maximum variety - clear cache and force new random
    scenario_service.current_scenario = None  # Clear cache
    scenario_service.last_rotation = 0  # Force rotation
    current_scenario = scenario_service.get_current_scenario()
    _graph = scenario_service.create_graph_from_scenario(current_scenario)
    
    # Clear histories
    prediction_service._density_history.clear()
    kpi_service._kpi_history.clear()
    agent_service._decision_log.clear()
    agent_service._action_registry.clear()
    _current_tick = 0
    
    print(f"🎭 Loaded scenario: {current_scenario.get('name', 'Unknown')}")


def run_tick(step: SimulationStep, operator_question: str = None) -> VenueState:
    """
    Full production pipeline for one simulation tick.
    Returns a VenueState ready to be serialised and sent to the frontend.
    """
    global _current_tick
    graph = get_graph()

    # 1. SIMULATE — update crowd positions
    simulation_service.simulate_tick(graph, phase=step.phase, multiplier=step.crowd_multiplier)

    # 2. RECORD — track density history for trend prediction
    prediction_service.record_snapshot(graph)

    # 3. DETECT — identify current and predicted congestion (with confidence)
    alerts = prediction_service.predict_congestion(graph)
    
    # Add scenario-specific alerts
    current_scenario = scenario_service.get_current_scenario()
    scenario_alerts = scenario_service.generate_alerts_from_scenario(current_scenario)
    alerts.extend(scenario_alerts)

    # 4. FORECAST — short-term density predictions (5/15/30 min)
    forecasts = prediction_service.generate_forecasts(graph)

    # 5. ROUTE — compute best exit paths (multi-objective)
    routes = routing_service.get_best_exit_routes(graph, alerts)

    # 6. NUDGE — generate attendee-facing messages
    nudges = nudge_service.generate_nudges(graph, alerts)

    # 7. REASON — agentic decision pipeline (observe → predict → simulate → act)
    actions = agent_service.run_agentic_pipeline(graph, alerts, step.step, step.phase)

    # 8. KPI — track business metrics
    kpis = kpi_service.compute_kpis(graph, alerts, nudges, step.step, step.phase)

    _current_tick = step.step + 1

    return _build_state(graph, alerts, nudges, routes, step.phase, forecasts, actions, kpis)


def _build_state(graph, alerts, nudges, routes, phase, forecasts, actions, kpis) -> VenueState:
    forecast_map = {f.node_id: f for f in forecasts}
    alert_map = {a.node_id: a for a in alerts}

    nodes = [
        NodeStatus(
            id=n.id,
            name=n.name,
            node_type=n.node_type.value,
            current_occupancy=n.current_occupancy,
            capacity=n.capacity,
            density=round(n.density, 3),
            status=n.status,
            x=n.x,
            y=n.y,
            trend=forecast_map[n.id].trend if n.id in forecast_map else getattr(n, "trend", "stable"),
            predicted_density=round(forecast_map[n.id].forecast_15min, 3) if n.id in forecast_map else getattr(n, "predicted_density", None),
            forecast_confidence=round(forecast_map[n.id].confidence, 3) if n.id in forecast_map else 0.0,
            risk_level=alert_map[n.id].alert_level.value if n.id in alert_map else None,
        )
        for n in graph.nodes.values()
    ]

    edges = [
        EdgeStatus(
            source=e.source,
            target=e.target,
            flow_rate=round(e.flow_rate, 2),
            max_flow=e.max_flow,
            weight=e.weight,
            is_saturated=e.is_saturated,
            utilization=round((e.flow_rate / e.max_flow) if e.max_flow else 0.0, 3),
        )
        for e in graph.edges
    ]

    overall_density = sum(n.density for n in graph.nodes.values()) / max(len(graph.nodes), 1)

    return VenueState(
        timestamp=datetime.utcnow(),
        nodes=nodes,
        edges=edges,
        alerts=alerts,
        nudges=nudges,
        routes=routes,
        overall_density=round(overall_density, 3),
        event_phase=phase,
        forecasts=forecasts,
        actions=actions,
        kpis=kpis,
    )
