from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core import engine, simulator
from app.services.security import get_api_key

router = APIRouter(dependencies=[Depends(get_api_key)])

_current_tick = 0


class TickRequest(BaseModel):
    tick: int = None  # if None, auto-advance


@router.post("/tick", summary="Advance simulation by one tick")
def advance_tick(req: TickRequest = TickRequest()):
    global _current_tick
    tick = req.tick if req.tick is not None else _current_tick
    step = simulator.get_scenario_step(tick)
    state = engine.run_tick(step)
    _current_tick = tick + 1
    return state.model_dump()


@router.post("/reset", summary="Reset simulation to initial state")
def reset_simulation():
    global _current_tick
    engine.reset()
    _current_tick = 0
    return {"message": "Simulation reset to initial state", "tick": 0}


@router.get("/scenario", summary="Get full event scenario timeline")
def get_scenario():
    return {
        "total_ticks": simulator.get_total_ticks(),
        "phases": {
            "pre_event":   "Ticks 0–19",
            "in_progress": "Ticks 20–99, 130–209",
            "halftime":    "Ticks 100–129",
            "post_event":  "Ticks 210–269",
        },
        "tick_duration_seconds": 30,
    }
