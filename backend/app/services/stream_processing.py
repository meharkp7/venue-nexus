from datetime import datetime, timezone
from typing import Dict, List, Optional

_event_queue: List[Dict] = []
_last_processed: Optional[datetime] = None


def enqueue_event(event: Dict) -> None:
    _event_queue.append({
        "event": event,
        "received_at": datetime.now(timezone.utc).isoformat(),
    })
    if len(_event_queue) > 500:
        _event_queue.pop(0)


def get_queue_length() -> int:
    return len(_event_queue)


def process_next_event() -> Optional[Dict]:
    global _last_processed
    if not _event_queue:
        return None
    event = _event_queue.pop(0)
    _last_processed = datetime.now(timezone.utc)
    return event


def get_last_event_timestamp() -> Optional[str]:
    return _last_processed.isoformat() if _last_processed else None


def get_pending_events() -> List[Dict]:
    return list(_event_queue)
