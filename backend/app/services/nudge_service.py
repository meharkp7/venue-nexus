from typing import List
from app.models.graph_model import VenueGraph, NodeType
from app.models.state_model import NudgeMessage, CongestionAlert, AlertLevel
from app.config import config


def generate_nudges(graph: VenueGraph, alerts: List[CongestionAlert]) -> List[NudgeMessage]:
    """
    Generate personalized nudges for attendees based on congestion alerts.
    
    Nudge types:
      1. Concession redirect (economic incentive)
      2. Exit redirect (safety)
      3. Sector flow warning (pre-emptive)
    """
    nudges: List[NudgeMessage] = []
    nudged_nodes = set()

    for alert in alerts:
        if alert.node_id in nudged_nodes:
            continue

        node = graph.nodes.get(alert.node_id)
        if not node:
            continue

        nudge = None

        if node.node_type == NodeType.CONCESSION:
            alt = _find_alternative_concession(graph, alert.node_id)
            if alt:
                nudge = NudgeMessage(
                    target_sector=alert.node_id,
                    message=f"{node.name} is at {int(node.density * 100)}% capacity. "
                            f"Head to {alt.name} — only a 2-min walk!",
                    incentive=f"{config.NUDGE_INCENTIVE_DISCOUNT}% off your next order at {alt.name}",
                    redirect_to=alt.id,
                    urgency=alert.alert_level,
                )

        elif node.node_type == NodeType.EXIT:
            alt = _find_alternative_exit(graph, alert.node_id)
            if alt:
                nudge = NudgeMessage(
                    target_sector=alert.node_id,
                    message=f"Exit congestion detected at {node.name}. "
                            f"Use {alt.name} for a faster exit — estimated 3 min faster!",
                    redirect_to=alt.id,
                    urgency=alert.alert_level,
                )

        elif node.node_type in (NodeType.CONCOURSE, NodeType.GATE):
            if alert.alert_level in (AlertLevel.HIGH, AlertLevel.CRITICAL):
                nudge = NudgeMessage(
                    target_sector=alert.node_id,
                    message=f"Heavy crowding near {node.name}. "
                            f"Please move to the adjacent concourse to ease congestion.",
                    urgency=alert.alert_level,
                )

        elif node.node_type == NodeType.SECTOR:
            if alert.predicted_surge_in_minutes and alert.predicted_surge_in_minutes <= 10:
                nudge = NudgeMessage(
                    target_sector=alert.node_id,
                    message=f"Heads up: {node.name} is expected to get crowded in ~"
                            f"{alert.predicted_surge_in_minutes} minutes. "
                            f"Consider moving to concessions now to beat the rush.",
                    urgency=AlertLevel.LOW,
                )

        if nudge:
            nudges.append(nudge)
            nudged_nodes.add(alert.node_id)

    return nudges


def _find_alternative_concession(graph: VenueGraph, exclude_id: str):
    """Return the least-crowded concession stand that isn't the excluded one."""
    concessions = [
        n for nid, n in graph.nodes.items()
        if n.node_type == NodeType.CONCESSION and nid != exclude_id
    ]
    if not concessions:
        return None
    return min(concessions, key=lambda n: n.density)


def _find_alternative_exit(graph: VenueGraph, exclude_id: str):
    """Return the least-crowded exit that isn't the excluded one."""
    exits = [
        n for nid, n in graph.nodes.items()
        if n.node_type == NodeType.EXIT and nid != exclude_id
    ]
    if not exits:
        return None
    return min(exits, key=lambda n: n.density)
