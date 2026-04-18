from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from app.services import edge_ingest, stream_processing
from app.services.security import get_api_key

router = APIRouter(dependencies=[Depends(get_api_key)])


class IngestEvent(BaseModel):
    node_id: str
    event_type: str
    payload: dict = Field(default_factory=dict)


@router.post("/event", summary="Receive edge ingest event")
def receive_edge_event(event: IngestEvent):
    edge_ingest.record_event(event.node_id, {"type": event.event_type, **event.payload})
    stream_processing.enqueue_event(
        {
            "source": "edge",
            "node_id": event.node_id,
            "event_type": event.event_type,
            "payload": event.payload,
        }
    )
    return {"status": "accepted", "node_id": event.node_id}


@router.get("/nodes", summary="List registered edge ingest nodes")
def list_edge_nodes():
    return {
        "edge_nodes": edge_ingest.get_edge_nodes(),
        "active_nodes": edge_ingest.get_active_edge_nodes(),
    }
