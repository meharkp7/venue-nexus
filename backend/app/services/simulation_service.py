import random
from app.models.graph_model import VenueGraph, VenueNode, VenueEdge, NodeType
from app.config import config


def build_default_venue() -> VenueGraph:
    """Construct a realistic stadium graph with nodes and edges."""
    graph = VenueGraph()

    # --- Nodes ---
    nodes = [
        # Entry gates
        VenueNode("gate_a", "Gate A (North)", NodeType.GATE, capacity=300, x=50, y=10),
        VenueNode("gate_b", "Gate B (South)", NodeType.GATE, capacity=300, x=50, y=90),
        VenueNode("gate_c", "Gate C (East)", NodeType.GATE, capacity=200, x=90, y=50),
        VenueNode("gate_d", "Gate D (West)", NodeType.GATE, capacity=200, x=10, y=50),

        # Concourses
        VenueNode("concourse_n", "North Concourse", NodeType.CONCOURSE, capacity=500, x=50, y=25),
        VenueNode("concourse_s", "South Concourse", NodeType.CONCOURSE, capacity=500, x=50, y=75),
        VenueNode("concourse_e", "East Concourse",  NodeType.CONCOURSE, capacity=400, x=75, y=50),
        VenueNode("concourse_w", "West Concourse",  NodeType.CONCOURSE, capacity=400, x=25, y=50),

        # Concessions
        VenueNode("concession_1", "Concession Stand A", NodeType.CONCESSION, capacity=80, x=50, y=20),
        VenueNode("concession_2", "Concession Stand B", NodeType.CONCESSION, capacity=80, x=50, y=80),
        VenueNode("concession_3", "Concession Stand C", NodeType.CONCESSION, capacity=60, x=80, y=50),

        # Sectors (seating)
        VenueNode("sector_101", "Sector 101", NodeType.SECTOR, capacity=600, x=40, y=40),
        VenueNode("sector_102", "Sector 102", NodeType.SECTOR, capacity=600, x=60, y=40),
        VenueNode("sector_103", "Sector 103", NodeType.SECTOR, capacity=600, x=40, y=60),
        VenueNode("sector_104", "Sector 104", NodeType.SECTOR, capacity=600, x=60, y=60),

        # Exits
        VenueNode("exit_1", "Main Exit (North)", NodeType.EXIT, capacity=400, x=50, y=5),
        VenueNode("exit_2", "Main Exit (South)", NodeType.EXIT, capacity=400, x=50, y=95),
        VenueNode("exit_3", "Side Exit (East)",  NodeType.EXIT, capacity=250, x=95, y=50),
        VenueNode("exit_4", "Side Exit (West)",  NodeType.EXIT, capacity=250, x=5, y=50),
    ]
    for node in nodes:
        graph.add_node(node)

    # --- Edges ---
    edges = [
        # Gates → Concourses
        VenueEdge("gate_a", "concourse_n", weight=1.0, max_flow=200),
        VenueEdge("gate_b", "concourse_s", weight=1.0, max_flow=200),
        VenueEdge("gate_c", "concourse_e", weight=1.0, max_flow=150),
        VenueEdge("gate_d", "concourse_w", weight=1.0, max_flow=150),

        # Concourses ↔ Concourses (ring)
        VenueEdge("concourse_n", "concourse_e", weight=1.2, max_flow=300),
        VenueEdge("concourse_e", "concourse_s", weight=1.2, max_flow=300),
        VenueEdge("concourse_s", "concourse_w", weight=1.2, max_flow=300),
        VenueEdge("concourse_w", "concourse_n", weight=1.2, max_flow=300),

        # Concourses → Concessions
        VenueEdge("concourse_n", "concession_1", weight=0.5, max_flow=100),
        VenueEdge("concourse_s", "concession_2", weight=0.5, max_flow=100),
        VenueEdge("concourse_e", "concession_3", weight=0.5, max_flow=80),

        # Concourses → Sectors
        VenueEdge("concourse_n", "sector_101", weight=1.0, max_flow=250),
        VenueEdge("concourse_n", "sector_102", weight=1.0, max_flow=250),
        VenueEdge("concourse_s", "sector_103", weight=1.0, max_flow=250),
        VenueEdge("concourse_s", "sector_104", weight=1.0, max_flow=250),
        VenueEdge("concourse_e", "sector_102", weight=1.0, max_flow=200),
        VenueEdge("concourse_w", "sector_101", weight=1.0, max_flow=200),

        # Concourses → Exits
        VenueEdge("concourse_n", "exit_1", weight=1.0, max_flow=300),
        VenueEdge("concourse_s", "exit_2", weight=1.0, max_flow=300),
        VenueEdge("concourse_e", "exit_3", weight=1.0, max_flow=200),
        VenueEdge("concourse_w", "exit_4", weight=1.0, max_flow=200),
    ]
    for edge in edges:
        graph.add_edge(edge)

    return graph


def simulate_tick(graph: VenueGraph, phase: str, multiplier: float = 1.0) -> VenueGraph:
    """
    Advance simulation one tick.
    Each tick represents ~30 seconds of real event time.
    """
    if phase == "pre_event":
        _simulate_entry(graph, rate=int(config.BASE_CROWD_ENTRY_RATE * multiplier))

    elif phase == "in_progress":
        _simulate_movement(graph, noise=0.05)

    elif phase == "halftime":
        _simulate_halftime_rush(graph, multiplier=config.HALFTIME_SPIKE_MULTIPLIER)

    elif phase == "post_event":
        _simulate_exit_rush(graph, multiplier=config.POST_EVENT_EXIT_MULTIPLIER)

    _update_edge_flows(graph)
    return graph


def _simulate_entry(graph: VenueGraph, rate: int):
    gates = [n for n in graph.nodes.values() if n.node_type == NodeType.GATE]
    for gate in gates:
        inflow = random.randint(int(rate * 0.7), int(rate * 1.3))
        gate.current_occupancy = min(gate.capacity, gate.current_occupancy + inflow)
        # Bleed into connected concourse
        for neighbor_id in graph.get_neighbors(gate.id):
            neighbor = graph.nodes.get(neighbor_id)
            if neighbor and neighbor.node_type == NodeType.CONCOURSE:
                transfer = int(gate.current_occupancy * 0.6)
                neighbor.current_occupancy = min(neighbor.capacity, neighbor.current_occupancy + transfer)
                gate.current_occupancy = max(0, gate.current_occupancy - transfer)


def _simulate_movement(graph: VenueGraph, noise: float = 0.05):
    for node in graph.nodes.values():
        drift = int(node.current_occupancy * noise * random.uniform(-1, 1))
        node.current_occupancy = max(0, min(node.capacity, node.current_occupancy + drift))


def _simulate_halftime_rush(graph: VenueGraph, multiplier: float):
    concessions = [n for n in graph.nodes.values() if n.node_type == NodeType.CONCESSION]
    concourses  = [n for n in graph.nodes.values() if n.node_type == NodeType.CONCOURSE]
    for node in concessions + concourses:
        surge = int(node.capacity * 0.2 * multiplier)
        node.current_occupancy = min(node.capacity, node.current_occupancy + surge)


def _simulate_exit_rush(graph: VenueGraph, multiplier: float):
    exits    = [n for n in graph.nodes.values() if n.node_type == NodeType.EXIT]
    sectors  = [n for n in graph.nodes.values() if n.node_type == NodeType.SECTOR]
    # Drain sectors
    for sector in sectors:
        drain = int(sector.current_occupancy * 0.15 * multiplier)
        sector.current_occupancy = max(0, sector.current_occupancy - drain)
    # Flood exits
    for exit_node in exits:
        surge = int(exit_node.capacity * 0.3 * multiplier)
        exit_node.current_occupancy = min(exit_node.capacity, exit_node.current_occupancy + surge)


def _update_edge_flows(graph: VenueGraph):
    for edge in graph.edges:
        src = graph.nodes.get(edge.source)
        tgt = graph.nodes.get(edge.target)
        if src and tgt:
            avg_density = (src.density + tgt.density) / 2
            edge.flow_rate = avg_density * edge.max_flow
