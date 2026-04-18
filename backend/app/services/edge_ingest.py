from datetime import datetime, timezone
from typing import Dict, List

_EDGE_NODES = [
    "camera_north",
    "camera_south",
    "ticket_scanner_east",
    "ticket_scanner_west",
    "beacon_concourse",
]

_last_seen: Dict[str, datetime] = {
    node: datetime.now(timezone.utc) for node in _EDGE_NODES
}
_recent_events: List[Dict] = []


def record_event(node_id: str, payload: dict) -> None:
    timestamp = datetime.now(timezone.utc)
    _last_seen[node_id] = timestamp
    _recent_events.append({
        "node_id": node_id,
        "payload": payload,
        "received_at": timestamp.isoformat(),
    })
    if len(_recent_events) > 250:
        _recent_events.pop(0)


def get_edge_node_count() -> int:
    return len(_EDGE_NODES)


def get_edge_nodes() -> List[str]:
    return list(_EDGE_NODES)


def get_active_edge_nodes(timeout_seconds: int = 120) -> int:
    now = datetime.now(timezone.utc)
    return sum(
        1
        for last in _last_seen.values()
        if (now - last).total_seconds() <= timeout_seconds
    )


def get_last_seen() -> Dict[str, str]:
    return {node: ts.isoformat() for node, ts in _last_seen.items()}


def get_recent_events() -> List[Dict]:
    return list(_recent_events)
