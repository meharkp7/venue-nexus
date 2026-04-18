from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class AlertLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ActionType(str, Enum):
    OPEN_GATE = "open_gate"
    CLOSE_GATE = "close_gate"
    DISPATCH_STAFF = "dispatch_staff"
    TRIGGER_NUDGE = "trigger_nudge"
    REDIRECT_FLOW = "redirect_flow"
    ADJUST_PRICING = "adjust_pricing"
    ACTIVATE_SIGNAGE = "activate_signage"
    EMERGENCY_PROTOCOL = "emergency_protocol"


class NodeStatus(BaseModel):
    id: str
    name: str
    node_type: str
    current_occupancy: int
    capacity: int
    density: float
    status: str  # green | yellow | red
    x: float
    y: float
    trend: str = "stable"
    predicted_density: Optional[float] = None
    forecast_confidence: float = 0.0
    risk_level: Optional[str] = None


class EdgeStatus(BaseModel):
    source: str
    target: str
    flow_rate: float
    max_flow: float
    weight: float
    is_saturated: bool
    utilization: float = 0.0


class CongestionAlert(BaseModel):
    node_id: str
    node_name: str
    density: float
    alert_level: AlertLevel
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    predicted_surge_in_minutes: Optional[int] = None
    confidence: float = 0.0           # 0–1 confidence score
    uncertainty_band: float = 0.0     # ± uncertainty


class ForecastPoint(BaseModel):
    """Short-term density forecast for a node."""
    node_id: str
    node_name: str
    current_density: float
    forecast_5min: float
    forecast_15min: float
    forecast_30min: float
    confidence: float
    uncertainty: float
    trend: str  # "rising" | "falling" | "stable"


class NudgeMessage(BaseModel):
    target_sector: str
    message: str
    incentive: Optional[str] = None
    redirect_to: Optional[str] = None
    urgency: AlertLevel = AlertLevel.LOW
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class RouteRecommendation(BaseModel):
    from_node: str
    to_node: str
    recommended_path: List[str]
    estimated_time_minutes: float
    reason: str
    cost_breakdown: Optional[Dict[str, float]] = None  # multi-objective costs


class StructuredAction(BaseModel):
    """An executable, auditable action produced by the agentic system."""
    id: str
    action_type: ActionType
    target_node: str
    target_node_name: str
    description: str
    priority: int  # 1 = highest
    confidence: float  # 0–1
    reasoning: str  # why the agent chose this
    estimated_impact: str  # e.g. "reduce density by ~15%"
    expected_impact_percent: Optional[float] = None
    eta_minutes: Optional[float] = None
    requires_approval: bool = True
    approved: bool = False
    executed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DecisionLogEntry(BaseModel):
    """Audit trail for every decision the system makes."""
    id: str
    tick: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    phase: str
    trigger: str  # what caused this decision
    reasoning_steps: List[str]
    actions_proposed: List[str]
    actions_executed: List[str]
    outcome: Optional[str] = None
    overall_density_before: float
    overall_density_after: Optional[float] = None


class WhatIfResult(BaseModel):
    """Result of a counterfactual simulation."""
    scenario_name: str
    description: str
    actions_simulated: List[str]
    density_before: float
    density_after: float
    improvement_pct: float
    affected_nodes: List[str]
    risk_level: str  # "low" | "medium" | "high"
    recommendation: str
    eta_minutes: Optional[float] = None


class KPISnapshot(BaseModel):
    """Business KPIs tracked per tick."""
    tick: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    avg_wait_time_minutes: float
    revenue_per_attendee: float
    total_concession_revenue: float
    congestion_incidents: int
    nudges_sent: int
    nudges_accepted: int  # simulated acceptance rate
    avg_density: float
    peak_density: float
    peak_node: str
    safety_score: float  # 0–100
    flow_efficiency: float  # 0–1


class VenueState(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    nodes: List[NodeStatus]
    edges: List[EdgeStatus]
    alerts: List[CongestionAlert]
    nudges: List[NudgeMessage]
    routes: List[RouteRecommendation]
    overall_density: float
    event_phase: str  # "pre_event" | "in_progress" | "halftime" | "post_event"
    # New industry-level fields
    forecasts: List[ForecastPoint] = []
    actions: List[StructuredAction] = []
    kpis: Optional[KPISnapshot] = None


class SimulationStep(BaseModel):
    step: int
    delta_seconds: int = 30
    phase: str
    crowd_multiplier: float = 1.0
