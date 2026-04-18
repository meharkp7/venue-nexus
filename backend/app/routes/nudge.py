from fastapi import APIRouter, Depends
from app.core.engine import get_graph
from app.services import prediction_service, nudge_service
from app.services.security import get_api_key

router = APIRouter(dependencies=[Depends(get_api_key)])


@router.get("/", summary="Get current nudge recommendations")
def get_nudges():
    graph = get_graph()
    alerts = prediction_service.predict_congestion(graph)
    nudges = nudge_service.generate_nudges(graph, alerts)
    return {
        "count": len(nudges),
        "nudges": [n.model_dump() for n in nudges],
    }
