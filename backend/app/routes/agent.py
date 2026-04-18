from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.engine import get_graph
from app.services import prediction_service, agent_service
from app.services.security import get_api_key

router = APIRouter(dependencies=[Depends(get_api_key)])


class AgentQuery(BaseModel):
    question: Optional[str] = None


class ActionApproval(BaseModel):
    action_id: str
    approved: bool = True
    reason: Optional[str] = None


@router.post("/strategy", summary="Get AI operational strategy")
def get_strategy(query: AgentQuery = AgentQuery()):
    graph = get_graph()
    alerts = prediction_service.predict_congestion(graph)
    strategy = agent_service.get_operational_strategy(graph, alerts, query.question)
    
    # Handle structured response from Vertex AI
    response_data = {
        "alert_count": len(alerts),
        "vertex_ai_active": bool(__import__("os").getenv("VERTEX_PROJECT_ID")),
    }
    
    if isinstance(strategy, dict) and strategy.get("status") == "success":
        # Structured JSON response from Vertex AI
        response_data.update({
            "strategy": strategy.get("raw_display", ""),
            "data": strategy.get("data", {}),
            "structured": True
        })
    else:
        # Fallback to text response
        response_data.update({
            "strategy": strategy,
            "structured": False
        })
    
    return response_data


@router.get("/decisions", summary="Get decision audit trail")
def get_decisions():
    return {
        "decisions": [d.model_dump() for d in agent_service.get_decision_log()],
        "pending_actions": [a.model_dump() for a in agent_service.get_pending_actions()],
    }


@router.post("/action/approve", summary="Approve or override a pending action (human-in-the-loop)")
def approve_action(approval: ActionApproval):
    if approval.approved:
        action = agent_service.approve_action(approval.action_id)
        return {"status": "approved", "action": action.model_dump() if action else None}
    else:
        action = agent_service.override_action(approval.action_id, approval.reason or "Operator override")
        return {"status": "overridden", "action": action.model_dump() if action else None}


@router.post("/action/execute", summary="Execute an approved action")
def execute_action(approval: ActionApproval):
    action = agent_service.execute_action(approval.action_id, get_graph())
    return {"status": "executed", "action": action.model_dump() if action else None}


@router.post("/whatif", summary="Run counterfactual what-if simulation")
def run_what_if(query: AgentQuery = AgentQuery()):
    graph = get_graph()
    alerts = prediction_service.predict_congestion(graph)
    results = agent_service.run_what_if(graph, query.question or "default", alerts)
    return {
        "scenarios": [r.model_dump() for r in results],
        "current_density": round(
            sum(n.density for n in graph.nodes.values()) / max(len(graph.nodes), 1), 3
        ),
    }
