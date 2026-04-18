import logging
import os

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routes import status, simulation, nudge, agent, kpi, health, ingest, stream
from app.services.settings import settings
from app.services.security import rate_limit

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("venue_nexus")

app = FastAPI(
    title="VenueNexus API",
    description="AI-powered real-time crowd management system — Production Grade",
    version="2.0.0",
    dependencies=[Depends(rate_limit)],
)

allowed_origins = [
    origin.strip()
    for origin in settings.allowed_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(status.router,     prefix="/status",     tags=["Status"])
app.include_router(simulation.router, prefix="/simulation", tags=["Simulation"])
app.include_router(nudge.router,      prefix="/nudge",      tags=["Nudge"])
app.include_router(agent.router,      prefix="/agent",      tags=["Agent"])
app.include_router(kpi.router,        prefix="/kpi",        tags=["KPI"])
app.include_router(health.router,     prefix="/health",     tags=["Health"])
app.include_router(ingest.router,     prefix="/edge",       tags=["Edge"])
app.include_router(stream.router,     prefix="/stream",     tags=["Stream"])


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info("request.start %s %s", request.method, request.url.path)
    response = await call_next(request)
    logger.info("request.complete %s %s %s", request.method, request.url.path, response.status_code)
    return response


@app.get("/")
def root():
    return {
        "message": "VenueNexus v2.0 — Production-Grade Crowd Intelligence 🏟️",
        "docs": "/docs",
        "health": "/health/",
        "capabilities": [
            "Real-time crowd simulation",
            "Spatio-temporal prediction with confidence scores",
            "Short-term forecasting (5/15/30 min)",
            "Multi-objective dynamic routing",
            "Agentic decision system (observe → predict → simulate → act)",
            "Counterfactual what-if simulation",
            "Human-in-the-loop action approval",
            "Business KPI tracking (revenue, safety, efficiency)",
            "Decision audit trail",
        ],
    }
