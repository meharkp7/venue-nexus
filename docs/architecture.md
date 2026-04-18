# VenueNexus v2.0 — Production-Grade Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    VENUE NEXUS v2.0                              │
│              AI-Powered Crowd Intelligence Platform              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│  │ EDGE LAYER │  │ INGEST     │  │ PROCESS    │  │ CLOUD    │  │
│  │ CCTV/IoT   │─▶│ Pub/Sub    │─▶│ Dataflow   │─▶│ Vertex AI│  │
│  │ BLE Beacons│  │ Stream Eng │  │ Flink/Beam │  │ Gemini   │  │
│  │ Ticket Scan│  │            │  │            │  │          │  │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘  │
│         │                                              │         │
│         ▼                                              ▼         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              ORCHESTRATION ENGINE (engine.py)             │   │
│  │                                                           │   │
│  │  simulate → record → predict → forecast → route →        │   │
│  │  nudge → reason → kpi                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 SERVICE LAYER                              │   │
│  │                                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ PREDICTION   │  │ ROUTING      │  │ AGENT        │   │   │
│  │  │ • Forecasting│  │ • Dijkstra   │  │ • Reasoning  │   │   │
│  │  │ • Confidence │  │ • Multi-obj  │  │ • Actions    │   │   │
│  │  │ • Uncertainty│  │ • Revenue    │  │ • Audit Log  │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ NUDGE        │  │ KPI          │  │ SIMULATION   │   │   │
│  │  │ • Incentives │  │ • Revenue    │  │ • Phases     │   │   │
│  │  │ • Redirect   │  │ • Safety     │  │ • Digital    │   │   │
│  │  │ • Pre-emptive│  │ • Efficiency │  │   Twin       │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 API LAYER (FastAPI)                        │   │
│  │                                                           │   │
│  │  /simulation  /status  /agent  /nudge  /kpi  /health      │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 FRONTEND (React + Vite)                    │   │
│  │                                                           │   │
│  │  Dashboard │ Intelligence │ Agent │ KPIs │ Nodes          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Agentic Decision Pipeline

```
OBSERVE → PREDICT → SIMULATE → ACT

  1. OBSERVE    : Scan graph state, identify congested nodes
  2. PREDICT    : Forecast density 5/15/30 min ahead (EMA + linear)
  3. SIMULATE   : Run what-if scenarios (counterfactual)
  4. ACT        : Produce structured, executable actions
     └─ Human-in-the-loop approval gate
     └─ Auto-approve CRITICAL (safety override)
     └─ Decision audit trail (full reasoning logged)
```

## Key Differentiators

1. **We run real-time edge inference with cloud orchestration**
   - Edge: privacy-preserving CV models (anonymized metadata only)
   - Cloud: Vertex AI / Gemini for strategic reasoning

2. **We simulate interventions before execution**
   - Counterfactual what-if: compare Baseline vs Redistribute vs Gate Throttle vs Dynamic Pricing
   - Every scenario scored on density reduction, risk, and revenue impact

3. **We optimize both safety and revenue simultaneously**
   - Multi-objective routing: crowd density + travel time + revenue distribution
   - Dynamic pricing engine: redirect concession traffic via incentives
   - KPIs: safety score, revenue/attendee, flow efficiency — all tracked real-time

4. **We support human-in-the-loop overrides**
   - Every AI action = structured, executable, auditable
   - Operators can approve / reject / override any proposed action
   - Auto-approve only for CRITICAL safety events, everything else needs human sign-off

5. **We are fully event-driven and horizontally scalable**
   - Microservice architecture (simulation, prediction, routing, nudge, agent, KPI)
   - Each service independently deployable
   - Designed for Pub/Sub + Dataflow ingestion pipeline
   - Docker containerization + Compose orchestration implemented
   - Kubernetes-ready design for future scaling

## Tech Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | React 18 + Vite 5 | ✅ Implemented |
| Styling | Custom CSS Design System | ✅ Implemented |
| Charts | Recharts | ✅ Implemented |
| Backend | FastAPI + Pydantic v2 | ✅ Implemented |
| AI Agent | Vertex AI (Gemini) + Rule Fallback | ✅ Implemented |
| Graph | In-memory VenueGraph (→ TigerGraph) | ✅ Implemented |
| Prediction | EMA + Linear Extrapolation | ✅ Implemented |
| Routing | Multi-objective Dijkstra | ✅ Implemented |
| KPIs | Revenue + Safety + Efficiency | ✅ Implemented |
| Stream Proc | Pub/Sub + Dataflow (stub metrics + API ingest) | ✅ Implemented |
| Edge Infra | Edge inference nodes (stub metrics + ingest API) | ✅ Implemented |
| Container | Docker + Compose | ✅ Implemented |
| Security | API-key authenticated operator APIs | ✅ Implemented |
