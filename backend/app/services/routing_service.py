"""
routing_service.py
------------------
Production-grade multi-objective dynamic routing engine.

Features:
  - Cost-based dynamic routing (not static shortest path)
  - Multi-objective optimization: crowd density + travel time + revenue distribution
  - Continuously updated edge weights
  - Emergency path handling (blocked paths, closures)
  - Route cost breakdown for transparency
"""

import heapq
from typing import List, Optional, Dict, Tuple
from app.models.graph_model import VenueGraph, NodeType
from app.models.state_model import RouteRecommendation, CongestionAlert
from app.config import config


# Cost weights for multi-objective optimization
WEIGHT_CONGESTION = 5.0    # penalize crowded paths
WEIGHT_TRAVEL = 1.0        # base traversal cost
WEIGHT_SATURATION = 2.5    # penalize saturated edges
WEIGHT_REVENUE = 0.3       # slight preference toward concessions (revenue)


# Blocked paths registry (for scenario simulation)
_blocked_paths: set = set()


def block_path(node_id: str):
    """Block a node (simulate closure / emergency)."""
    _blocked_paths.add(node_id)


def unblock_path(node_id: str):
    """Unblock a previously blocked node."""
    _blocked_paths.discard(node_id)


def get_blocked_paths() -> list:
    return list(_blocked_paths)


def get_best_exit_routes(graph: VenueGraph, alerts: List[CongestionAlert]) -> List[RouteRecommendation]:
    """
    For each congested sector/concourse, find the fastest path to an exit
    that avoids congested + blocked nodes. Multi-objective cost function.
    """
    congested_ids = {a.node_id for a in alerts if a.density >= config.DENSITY_RED}
    exit_ids = [nid for nid, n in graph.nodes.items() if n.node_type == NodeType.EXIT]
    sector_ids = [nid for nid, n in graph.nodes.items() if n.node_type == NodeType.SECTOR]

    recommendations: List[RouteRecommendation] = []

    for sector_id in sector_ids:
        best_path, best_cost, best_exit, best_breakdown = None, float("inf"), None, None
        for exit_id in exit_ids:
            if exit_id in _blocked_paths:
                continue
            path, cost, breakdown = dijkstra_multi_objective(graph, sector_id, exit_id, congested_ids)
            if path and cost < best_cost:
                best_path, best_cost, best_exit, best_breakdown = path, cost, exit_id, breakdown

        if best_path:
            exit_node = graph.nodes.get(best_exit)
            sector_node = graph.nodes.get(sector_id)
            est_minutes = round(best_cost * 0.5, 1)  # ~0.5 min per unit cost
            recommendations.append(RouteRecommendation(
                from_node=sector_id,
                to_node=best_exit,
                recommended_path=best_path,
                estimated_time_minutes=est_minutes,
                reason=f"Fastest uncongested path from {sector_node.name} to {exit_node.name}",
                cost_breakdown=best_breakdown,
            ))

    return recommendations


def dijkstra_multi_objective(
    graph: VenueGraph,
    start: str,
    end: str,
    blocked_nodes: set = None,
) -> Tuple[Optional[List[str]], float, Optional[Dict[str, float]]]:
    """
    Multi-objective Dijkstra's shortest path.
    Cost = f(base_weight, congestion_penalty, saturation_penalty, revenue_bonus).
    """
    blocked_nodes = (blocked_nodes or set()) | _blocked_paths
    dist: Dict[str, float] = {nid: float("inf") for nid in graph.nodes}
    prev: Dict[str, Optional[str]] = {nid: None for nid in graph.nodes}
    cost_tracking: Dict[str, Dict[str, float]] = {}
    dist[start] = 0.0
    heap = [(0.0, start)]

    while heap:
        current_dist, u = heapq.heappop(heap)
        if current_dist > dist[u]:
            continue
        if u == end:
            break

        for neighbor_id in graph.get_neighbors(u):
            if neighbor_id in _blocked_paths and neighbor_id != end:
                continue

            edge = graph.get_edge(u, neighbor_id)
            if not edge:
                continue

            # Multi-objective cost calculation
            base_cost = edge.weight * WEIGHT_TRAVEL
            congestion_cost = 0.0
            saturation_cost = 0.0
            revenue_bonus = 0.0

            neighbor_node = graph.nodes.get(neighbor_id)

            # Congestion penalty
            if neighbor_id in blocked_nodes:
                congestion_cost = WEIGHT_CONGESTION
            if neighbor_node:
                congestion_cost += neighbor_node.density * WEIGHT_CONGESTION * 0.5

            # Saturation penalty
            if edge.is_saturated:
                saturation_cost = WEIGHT_SATURATION

            # Revenue bonus (slight preference for paths near concessions)
            if neighbor_node and neighbor_node.node_type == NodeType.CONCESSION:
                if neighbor_node.density < 0.6:
                    revenue_bonus = -WEIGHT_REVENUE  # negative = bonus

            total_cost = base_cost + congestion_cost + saturation_cost + revenue_bonus
            new_dist = dist[u] + total_cost

            if new_dist < dist[neighbor_id]:
                dist[neighbor_id] = new_dist
                prev[neighbor_id] = u
                cost_tracking[neighbor_id] = {
                    "travel": round(base_cost, 2),
                    "congestion": round(congestion_cost, 2),
                    "saturation": round(saturation_cost, 2),
                    "revenue_adj": round(revenue_bonus, 2),
                }
                heapq.heappush(heap, (new_dist, neighbor_id))

    # Reconstruct path
    if dist[end] == float("inf"):
        return None, float("inf"), None

    path = []
    current = end
    while current is not None:
        path.append(current)
        current = prev[current]
    path.reverse()

    # Aggregate cost breakdown
    breakdown = {"travel": 0.0, "congestion": 0.0, "saturation": 0.0, "revenue_adj": 0.0}
    for node_id in path:
        if node_id in cost_tracking:
            for k, v in cost_tracking[node_id].items():
                breakdown[k] += v
    breakdown = {k: round(v, 2) for k, v in breakdown.items()}

    return path, dist[end], breakdown
