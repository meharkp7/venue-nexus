"""
KPI and analytics routes.
Business intelligence dashboard API.
"""

from fastapi import APIRouter, Depends
from app.services import kpi_service
from app.services.security import get_api_key

router = APIRouter(dependencies=[Depends(get_api_key)])


@router.get("/", summary="Get KPI history (last 50 ticks)")
def get_kpi_history():
    history = kpi_service.get_kpi_history()
    return {
        "count": len(history),
        "kpis": [k.model_dump() for k in history],
    }


@router.get("/summary", summary="Get aggregate KPI summary for the event")
def get_kpi_summary():
    return kpi_service.get_kpi_summary()
