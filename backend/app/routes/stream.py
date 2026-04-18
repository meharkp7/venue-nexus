from fastapi import APIRouter, Depends
from app.services import stream_processing
from app.services.security import get_api_key

router = APIRouter(dependencies=[Depends(get_api_key)])


@router.post("/event", summary="Enqueue stream processing event")
def enqueue_stream_event(event: dict):
    stream_processing.enqueue_event(event)
    return {
        "status": "queued",
        "queue_length": stream_processing.get_queue_length(),
    }


@router.get("/pending", summary="Get pending stream events")
def get_pending_stream_events():
    return {
        "queue_length": stream_processing.get_queue_length(),
        "pending": stream_processing.get_pending_events(),
    }


@router.post("/process", summary="Process next stream event")
def process_next_stream_event():
    event = stream_processing.process_next_event()
    return {
        "processed": event,
        "queue_length": stream_processing.get_queue_length(),
    }
