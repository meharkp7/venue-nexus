"""
prediction_service.py
--------------------
Spatio-temporal prediction engine with confidence scoring,
short-term forecasting (5–30 min), and uncertainty estimation.

Industry-level: replaces simple threshold checks with trend-based
probabilistic forecasting + rolling statistics.
"""

import math
from typing import List, Dict, Tuple, Optional
from datetime import datetime
from app.models.graph_model import VenueGraph, VenueNode
from app.models.state_model import CongestionAlert, AlertLevel, ForecastPoint
from app.config import config


# Rolling history for trend-based prediction (per node)
_density_history: Dict[str, List[float]] = {}
_HISTORY_WINDOW = 10  # ticks to keep for forecasting


def record_snapshot(graph: VenueGraph):
    """Call at the end of every tick to track density trends."""
    for node_id, node in graph.nodes.items():
        if node_id not in _density_history:
            _density_history[node_id] = []
        history = _density_history[node_id]
        history.append(node.density)
        if len(history) > _HISTORY_WINDOW:
            history.pop(0)


def predict_congestion(graph: VenueGraph) -> List[CongestionAlert]:
    """
    Analyze current densities + recent trend to produce congestion alerts
    with confidence scoring and uncertainty estimation.
    """
    alerts: List[CongestionAlert] = []

    for node_id, node in graph.nodes.items():
        alert_level, predicted_surge, confidence, uncertainty = _evaluate_node(node_id, node)
        if alert_level:
            alerts.append(CongestionAlert(
                node_id=node.id,
                node_name=node.name,
                density=node.density,
                alert_level=alert_level,
                timestamp=datetime.utcnow(),
                predicted_surge_in_minutes=predicted_surge,
                confidence=round(confidence, 3),
                uncertainty_band=round(uncertainty, 3),
            ))

    return sorted(alerts, key=lambda a: a.density, reverse=True)


def generate_forecasts(graph: VenueGraph) -> List[ForecastPoint]:
    """
    Short-term forecasting (5, 15, 30 min ahead) for all nodes.
    Uses exponential smoothing + linear extrapolation with confidence decay.
    """
    forecasts: List[ForecastPoint] = []
    tick_seconds = config.SIMULATION_TICK_SECONDS  # 30s per tick

    for node_id, node in graph.nodes.items():
        history = _density_history.get(node_id, [])
        current = node.density

        if len(history) < 3:
            # Not enough data — flat forecast
            forecasts.append(ForecastPoint(
                node_id=node_id,
                node_name=node.name,
                current_density=round(current, 3),
                forecast_5min=round(current, 3),
                forecast_15min=round(current, 3),
                forecast_30min=round(current, 3),
                confidence=0.3,
                uncertainty=0.12,
                trend="stable",
            ))
            continue

        slope = _linear_slope(history)
        ema = _exponential_moving_average(history, alpha=0.3)
        volatility = _volatility(history)

        # Ticks ahead for each forecast window
        ticks_5 = (5 * 60) / tick_seconds    # 10 ticks
        ticks_15 = (15 * 60) / tick_seconds   # 30 ticks
        ticks_30 = (30 * 60) / tick_seconds   # 60 ticks

        f5 = _clamp(ema + slope * ticks_5)
        f15 = _clamp(ema + slope * ticks_15)
        f30 = _clamp(ema + slope * ticks_30)

        # Confidence decays with horizon + volatility
        base_conf = max(0.2, 1.0 - volatility * 3)
        conf = base_conf * 0.9  # near-term confidence

        uncertainty = min(volatility * 2, 0.3)
        trend = "rising" if slope > 0.01 else ("falling" if slope < -0.01 else "stable")

        forecasts.append(ForecastPoint(
            node_id=node_id,
            node_name=node.name,
            current_density=round(current, 3),
            forecast_5min=round(f5, 3),
            forecast_15min=round(f15, 3),
            forecast_30min=round(f30, 3),
            confidence=round(conf, 3),
            uncertainty=round(uncertainty, 3),
            trend=trend,
        ))

    return forecasts


def _evaluate_node(node_id: str, node: VenueNode) -> Tuple[Optional[AlertLevel], Optional[int], float, float]:
    """Returns (AlertLevel | None, predicted_surge_minutes | None, confidence, uncertainty)."""
    density = node.density
    history = _density_history.get(node_id, [])
    volatility = _volatility(history) if len(history) >= 2 else 0.05

    # Uncertainty band based on volatility
    uncertainty = min(volatility * 2, 0.3)

    # Immediate red-zone
    if density >= config.DENSITY_CRITICAL:
        confidence = 0.95 - uncertainty * 0.5
        return AlertLevel.CRITICAL, 0, confidence, uncertainty

    if density >= config.DENSITY_RED:
        confidence = 0.90 - uncertainty * 0.5
        return AlertLevel.HIGH, 0, confidence, uncertainty

    # Trend-based prediction with confidence
    if len(history) >= 3:
        slope = _linear_slope(history)
        if slope > 0.02:  # density rising > 2% per tick
            ticks_to_breach = _estimate_ticks_to(density, slope, config.DENSITY_RED)
            minutes_to_breach = ticks_to_breach * (config.SIMULATION_TICK_SECONDS / 60)

            # Confidence decreases with prediction horizon
            horizon_factor = max(0.3, 1.0 - (minutes_to_breach / config.PREDICTION_WINDOW_MINUTES) * 0.5)
            confidence = horizon_factor * (1.0 - uncertainty)

            if minutes_to_breach <= config.PREDICTION_WINDOW_MINUTES:
                level = AlertLevel.MEDIUM if density < config.DENSITY_YELLOW else AlertLevel.HIGH
                return level, int(minutes_to_breach), confidence, uncertainty

    if density >= config.DENSITY_YELLOW:
        confidence = 0.70
        return AlertLevel.LOW, None, confidence, uncertainty

    return None, None, 0.0, uncertainty


def _linear_slope(values: List[float]) -> float:
    """Simple least-squares slope over a list of floats."""
    n = len(values)
    if n < 2:
        return 0.0
    x_mean = (n - 1) / 2
    y_mean = sum(values) / n
    numerator   = sum((i - x_mean) * (v - y_mean) for i, v in enumerate(values))
    denominator = sum((i - x_mean) ** 2 for i in range(n))
    return numerator / denominator if denominator else 0.0


def _exponential_moving_average(values: List[float], alpha: float = 0.3) -> float:
    """EMA with given smoothing factor."""
    if not values:
        return 0.0
    ema = values[0]
    for v in values[1:]:
        ema = alpha * v + (1 - alpha) * ema
    return ema


def _volatility(values: List[float]) -> float:
    """Standard deviation as a measure of prediction uncertainty."""
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    return math.sqrt(variance)


def _clamp(v: float) -> float:
    return max(0.0, min(1.0, v))


def _estimate_ticks_to(current: float, slope: float, target: float) -> float:
    if slope <= 0:
        return float("inf")
    return (target - current) / slope
