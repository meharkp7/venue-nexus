from fastapi import APIRouter, Depends
from app.core.engine import get_graph
from app.models.state_model import NodeStatus
from app.services.security import get_api_key

router = APIRouter(dependencies=[Depends(get_api_key)])


@router.get("/", summary="Full venue snapshot")
def get_status():
    graph = get_graph()
    return {
        "summary": graph.summary(),
        "nodes": [
            NodeStatus(
                id=n.id, name=n.name, node_type=n.node_type.value,
                current_occupancy=n.current_occupancy, capacity=n.capacity,
                density=round(n.density, 3), status=n.status, x=n.x, y=n.y,
            ).model_dump()
            for n in graph.nodes.values()
        ],
    }


@router.get("/node/{node_id}", summary="Single node status")
def get_node_status(node_id: str):
    graph = get_graph()
    node = graph.nodes.get(node_id)
    if not node:
        return {"error": f"Node '{node_id}' not found"}
    return {
        "id": node.id,
        "name": node.name,
        "density": round(node.density, 3),
        "status": node.status,
        "occupancy": node.current_occupancy,
        "capacity": node.capacity,
    }
