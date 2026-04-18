"""
simulator.py
------------
Defines the event timeline as a sequence of SimulationSteps.
The frontend (or tests) can call `get_scenario_step(tick)` to get
the correct phase + multiplier for any moment in the event lifecycle.
"""

from app.models.state_model import SimulationStep

# Full event lifecycle (each step = 1 tick = 30 seconds real time)
EVENT_SCENARIO: list[SimulationStep] = (
    # Pre-event: gates open, crowd trickles in (ticks 0–19 = 10 min)
    [SimulationStep(step=i, phase="pre_event",   crowd_multiplier=0.6 + i * 0.02) for i in range(20)] +
    # Match in progress: steady state (ticks 20–99 = 40 min)
    [SimulationStep(step=i, phase="in_progress", crowd_multiplier=1.0)             for i in range(20, 100)] +
    # Halftime rush (ticks 100–129 = 15 min)
    [SimulationStep(step=i, phase="halftime",     crowd_multiplier=2.5)             for i in range(100, 130)] +
    # Second half (ticks 130–209)
    [SimulationStep(step=i, phase="in_progress", crowd_multiplier=1.0)             for i in range(130, 210)] +
    # Post-event exit rush (ticks 210–269 = 30 min)
    [SimulationStep(step=i, phase="post_event",  crowd_multiplier=3.0)             for i in range(210, 270)]
)


def get_scenario_step(tick: int) -> SimulationStep:
    """Return the SimulationStep for a given tick index (clamps to last step)."""
    idx = min(tick, len(EVENT_SCENARIO) - 1)
    return EVENT_SCENARIO[idx]


def get_total_ticks() -> int:
    return len(EVENT_SCENARIO)
