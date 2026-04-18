from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum


class NodeType(str, Enum):
    GATE = "gate"
    CONCOURSE = "concourse"
    CONCESSION = "concession"
    EXIT = "exit"
    SECTOR = "sector"


@dataclass
class VenueNode:
    id: str
    name: str
    node_type: NodeType
    capacity: int
    current_occupancy: int = 0
    x: float = 0.0  # for visualization
    y: float = 0.0

    @property
    def density(self) -> float:
        return self.current_occupancy / self.capacity if self.capacity > 0 else 0.0

    @property
    def is_congested(self) -> bool:
        return self.density >= 0.80

    @property
    def status(self) -> str:
        if self.density < 0.5:
            return "green"
        elif self.density < 0.80:
            return "yellow"
        else:
            return "red"


@dataclass
class VenueEdge:
    source: str
    target: str
    weight: float = 1.0          # traversal cost (lower = preferred)
    flow_rate: float = 0.0       # people/minute currently using this path
    max_flow: float = 200.0      # max people/minute capacity

    @property
    def is_saturated(self) -> bool:
        return self.flow_rate >= self.max_flow * 0.9


@dataclass
class VenueGraph:
    nodes: Dict[str, VenueNode] = field(default_factory=dict)
    edges: List[VenueEdge] = field(default_factory=list)

    def add_node(self, node: VenueNode):
        self.nodes[node.id] = node

    def add_edge(self, edge: VenueEdge):
        self.edges.append(edge)

    def get_neighbors(self, node_id: str) -> List[str]:
        neighbors = []
        for edge in self.edges:
            if edge.source == node_id:
                neighbors.append(edge.target)
            elif edge.target == node_id:
                neighbors.append(edge.source)
        return neighbors

    def get_edge(self, source: str, target: str) -> Optional[VenueEdge]:
        for edge in self.edges:
            if (edge.source == source and edge.target == target) or \
               (edge.source == target and edge.target == source):
                return edge
        return None

    def get_congested_nodes(self) -> List[VenueNode]:
        return [n for n in self.nodes.values() if n.is_congested]

    def summary(self) -> dict:
        return {
            "total_nodes": len(self.nodes),
            "total_edges": len(self.edges),
            "congested_nodes": [n.id for n in self.get_congested_nodes()],
            "overall_density": sum(n.density for n in self.nodes.values()) / max(len(self.nodes), 1)
        }
