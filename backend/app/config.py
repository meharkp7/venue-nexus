from dataclasses import dataclass


@dataclass
class Config:
    # Congestion thresholds
    DENSITY_YELLOW: float = 0.50
    DENSITY_RED: float = 0.80
    DENSITY_CRITICAL: float = 0.95

    # Prediction window
    PREDICTION_WINDOW_MINUTES: int = 15

    # Simulation
    SIMULATION_TICK_SECONDS: int = 30
    BASE_CROWD_ENTRY_RATE: int = 50       # people/tick entering during pre-event
    HALFTIME_SPIKE_MULTIPLIER: float = 2.5
    POST_EVENT_EXIT_MULTIPLIER: float = 3.0

    # Nudge incentive thresholds
    NUDGE_TRIGGER_DENSITY: float = 0.75
    NUDGE_INCENTIVE_DISCOUNT: int = 10    # percent

    # Routing
    MAX_ROUTE_HOPS: int = 5
    EDGE_CONGESTION_PENALTY: float = 5.0  # added to weight when saturated


config = Config()
