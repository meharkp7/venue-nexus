"""
kpi_service.py
--------------
Business intelligence and KPI tracking layer.

Tracks:
  - Average wait time
  - Revenue per attendee
  - Concession revenue optimization
  - Congestion incidents
  - Safety score
  - Flow efficiency
  - Nudge effectiveness (simulated)

This positions VenueNexus as a revenue + safety platform,
not just a crowd management tool.
"""

import random
from typing import List
from datetime import datetime
from app.models.graph_model import VenueGraph, NodeType
from app.models.state_model import (
    KPISnapshot, CongestionAlert, NudgeMessage, AlertLevel
)

# Historical KPIs for trend analysis
_kpi_history: List[KPISnapshot] = []


def compute_kpis(
    graph: VenueGraph,
    alerts: List[CongestionAlert],
    nudges: List[NudgeMessage],
    tick: int,
    phase: str,
) -> KPISnapshot:
    """Compute KPIs for the current tick."""

    nodes = list(graph.nodes.values())
    total_occupancy = sum(n.current_occupancy for n in nodes)
    densities = [n.density for n in nodes]

    # Average wait time (simulated: proportional to density)
    avg_density = sum(densities) / max(len(densities), 1)
    avg_wait = _estimate_wait_time(avg_density, phase)

    # Revenue modeling
    concessions = [n for n in nodes if n.node_type == NodeType.CONCESSION]
    conc_occupancy = sum(n.current_occupancy for n in concessions)
    # Average $8 per person per concession visit, with density discount
    conc_revenue = conc_occupancy * 8.0 * (0.5 + 0.5 * random.uniform(0.7, 1.3))
    revenue_per_attendee = conc_revenue / max(total_occupancy, 1)

    # Congestion incidents (critical/high alerts)
    incidents = len([a for a in alerts if a.alert_level in (AlertLevel.CRITICAL, AlertLevel.HIGH)])

    # Nudge effectiveness (simulated: 40-70% acceptance)
    nudge_accepted = int(len(nudges) * random.uniform(0.4, 0.7))

    # Safety score (100 = perfect, decreases with congestion)
    max_density = max(densities) if densities else 0
    safety_score = max(0, 100 - (max_density * 80) - (incidents * 10))

    # Flow efficiency (ratio of actual flow vs optimal)
    total_flow = sum(e.flow_rate for e in graph.edges)
    max_possible = sum(e.max_flow for e in graph.edges)
    flow_efficiency = total_flow / max(max_possible, 1)

    peak_node = max(nodes, key=lambda n: n.density) if nodes else None

    kpi = KPISnapshot(
        tick=tick,
        timestamp=datetime.utcnow(),
        avg_wait_time_minutes=round(avg_wait, 1),
        revenue_per_attendee=round(revenue_per_attendee, 2),
        total_concession_revenue=round(conc_revenue, 2),
        congestion_incidents=incidents,
        nudges_sent=len(nudges),
        nudges_accepted=nudge_accepted,
        avg_density=round(avg_density, 3),
        peak_density=round(max_density, 3),
        peak_node=peak_node.name if peak_node else "—",
        safety_score=round(safety_score, 1),
        flow_efficiency=round(flow_efficiency, 3),
    )

    _kpi_history.append(kpi)
    if len(_kpi_history) > 300:
        _kpi_history.pop(0)

    return kpi


def get_kpi_history() -> List[KPISnapshot]:
    return _kpi_history[-50:]


def get_kpi_summary() -> dict:
    """Aggregate KPI summary for the event."""
    if not _kpi_history:
        return {"status": "No data yet"}

    return {
        "total_ticks": len(_kpi_history),
        "avg_wait_time": round(sum(k.avg_wait_time_minutes for k in _kpi_history) / len(_kpi_history), 1),
        "total_revenue": round(sum(k.total_concession_revenue for k in _kpi_history), 2),
        "total_congestion_incidents": sum(k.congestion_incidents for k in _kpi_history),
        "avg_safety_score": round(sum(k.safety_score for k in _kpi_history) / len(_kpi_history), 1),
        "total_nudges_sent": sum(k.nudges_sent for k in _kpi_history),
        "total_nudges_accepted": sum(k.nudges_accepted for k in _kpi_history),
        "nudge_accept_rate": round(
            sum(k.nudges_accepted for k in _kpi_history) / max(sum(k.nudges_sent for k in _kpi_history), 1) * 100, 1
        ),
        "peak_density_ever": round(max(k.peak_density for k in _kpi_history), 3),
        "avg_flow_efficiency": round(sum(k.flow_efficiency for k in _kpi_history) / len(_kpi_history), 3),
    }


def _estimate_wait_time(avg_density: float, phase: str) -> float:
    """Estimate wait time based on density and phase."""
    base_wait = {
        "pre_event": 2.0,
        "in_progress": 1.0,
        "halftime": 5.0,
        "post_event": 8.0,
    }.get(phase, 2.0)

    # Wait grows exponentially with density
    return base_wait * (1 + avg_density ** 2 * 3) + random.uniform(-0.5, 0.5)
