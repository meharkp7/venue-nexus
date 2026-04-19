"""
Demo Scenario Service
Provides diverse venue scenarios for richer simulation results.
"""

import json
import random
import time
from typing import Dict, List, Optional
from pathlib import Path
from app.models.graph_model import VenueGraph, VenueNode, VenueEdge, NodeType
from app.models.state_model import CongestionAlert, AlertLevel

class ScenarioService:
    def __init__(self):
        from pathlib import Path
        BASE_DIR = Path(__file__).resolve().parent.parent.parent
        self.scenarios_file = BASE_DIR / "data" / "demo_scenarios_100.json"
        self.current_scenario = None
        self.last_rotation = time.time()
        self.rotation_interval = 10  # 10 seconds for maximum variety
        self.load_scenarios()
    
    def load_scenarios(self):
        """Load demo scenarios from JSON file"""
        try:
            with open(self.scenarios_file, 'r') as f:
                self.scenarios_data = json.load(f)
            print(f"✅ Loaded {len(self.scenarios_data['scenarios'])} demo scenarios")
        except Exception as e:
            print(f"❌ Failed to load scenarios: {e}")
            self.scenarios_data = {"scenarios": {}}
    
    def get_available_scenarios(self) -> List[str]:
        """Get list of available scenario names"""
        return list(self.scenarios_data.get("scenarios", {}).keys())
    
    def get_scenario(self, scenario_name: str) -> Optional[Dict]:
        """Get specific scenario by name"""
        return self.scenarios_data.get("scenarios", {}).get(scenario_name)
    
    def get_random_scenario(self) -> Dict:
        """Get random scenario based on weights - improved for true randomness"""
        scenarios = self.scenarios_data.get("scenarios", {})
        if not scenarios:
            return self._get_fallback_scenario()
        
        # Use weights if available
        weights = self.scenarios_data.get("scenario_rotation", {}).get("weights", {})
        if weights:
            scenario_names = list(scenarios.keys())
            scenario_weights = [weights.get(name, 1.0) for name in scenario_names]
            # Add small random variation to weights to break patterns
            scenario_weights = [w + random.uniform(-0.01, 0.01) for w in scenario_weights]
            selected_name = random.choices(scenario_names, weights=scenario_weights)[0]
        else:
            # Use system random for better randomness
            selected_name = random.SystemRandom().choice(list(scenarios.keys()))
        
        return scenarios[selected_name]
    
    def get_current_scenario(self) -> Dict:
        """Get current scenario with auto-rotation - always random to avoid repetition"""
        current_time = time.time()
        rotation_config = self.scenarios_data.get("scenario_rotation", {})
        
        # Always get a new random scenario to avoid repetition
        if (rotation_config.get("enabled", False) and 
            current_time - self.last_rotation > self.rotation_interval):
            # Add entropy based on current time to ensure uniqueness
            random.seed(int(current_time * 1000000) % 2**32)
            self.current_scenario = self.get_random_scenario()
            self.last_rotation = current_time
            print(f"🔄 Rotated to scenario: {self.current_scenario.get('name', 'Unknown')}")
        elif not self.current_scenario:
            # Always get random on first load
            random.seed(int(current_time * 1000000) % 2**32)
            self.current_scenario = self.get_random_scenario()
            print(f"🎭 Initial scenario: {self.current_scenario.get('name', 'Unknown')}")
        
        return self.current_scenario
    
    def create_graph_from_scenario(self, scenario: Dict) -> VenueGraph:
        """Create VenueGraph from scenario configuration"""
        graph_config = scenario.get("graph_config", {})
        nodes_data = graph_config.get("nodes", [])
        edges_data = graph_config.get("edges", [])
        
        # Create nodes
        nodes = {}
        for node_data in nodes_data:
            density = node_data.get("density", 0.0)
            current_occupancy = int(density * node_data.get("capacity", 100))
            
            # Convert string node_type to NodeType enum
            node_type_str = node_data["node_type"]
            node_type = NodeType(node_type_str) if isinstance(node_type_str, str) else node_type_str
            
            node = VenueNode(
                id=node_data["id"],
                name=node_data["id"].replace("_", " ").title(),
                node_type=node_type,
                x=node_data["x"],
                y=node_data["y"],
                capacity=node_data.get("capacity", 100),
                current_occupancy=current_occupancy
            )
            # Add extra attributes for frontend
            node.trend = node_data.get("trend", "stable")
            node.predicted_density = node_data.get("predicted_density")
            nodes[node.id] = node
        
        # Create edges
        edges = []
        for edge_data in edges_data:
            edge = VenueEdge(
                source=edge_data["source"],
                target=edge_data["target"],
                weight=1.0,
                flow_rate=edge_data.get("flow_rate", 0.5) * 200,  # Convert to people/minute
                max_flow=edge_data.get("capacity", 100)
            )
            # Store saturation info in a separate attribute for frontend
            edge._is_saturated = edge_data.get("is_saturated", False)
            edges.append(edge)
        
        return VenueGraph(nodes=nodes, edges=edges)
    
    def generate_alerts_from_scenario(self, scenario: Dict) -> List[CongestionAlert]:
        """Generate alerts based on scenario configuration"""
        alerts = []
        events = scenario.get("events", [])
        nodes_data = scenario.get("graph_config", {}).get("nodes", [])
        
        for event in events:
            if event["type"] in ["congestion_spike", "critical_congestion", "flow_bottleneck"]:
                severity = event.get("severity", "medium")
                if severity == "critical":
                    level = AlertLevel.CRITICAL
                elif severity == "high":
                    level = AlertLevel.HIGH
                else:
                    level = AlertLevel.MEDIUM
                
                # Get node info from scenario
                node_id = event["node_id"]
                node_data = next((n for n in nodes_data if n["id"] == node_id), None)
                node_name = node_data["id"].replace("_", " ").title() if node_data else node_id.replace("_", " ").title()
                density = node_data.get("density", 0.8) if node_data else 0.8
                
                # Handle timestamp validation - use current time if invalid
                timestamp = event.get("timestamp", time.time())
                if isinstance(timestamp, str):
                    try:
                        # Validate timestamp format
                        import datetime
                        # Try to parse the timestamp to validate it
                        datetime.datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    except (ValueError, AttributeError):
                        # If timestamp is invalid, use current time
                        timestamp = time.time()
                elif not isinstance(timestamp, (int, float)):
                    timestamp = time.time()
                
                alert = CongestionAlert(
                    node_id=node_id,
                    node_name=node_name,
                    density=density,
                    alert_level=level,
                    message=f"{event['type'].replace('_', ' ').title()} detected at {node_id}",
                    timestamp=timestamp,
                    confidence=random.uniform(0.8, 0.95)
                )
                alerts.append(alert)
        
        # Also generate alerts based on node densities
        for node_data in nodes_data:
            density = node_data.get("density", 0.0)
            node_name = node_data["id"].replace("_", " ").title()
            
            if density >= 0.9:
                alert = CongestionAlert(
                    node_id=node_data["id"],
                    node_name=node_name,
                    density=density,
                    alert_level=AlertLevel.CRITICAL,
                    message=f"Critical density at {node_data['id']}: {density:.0%}",
                    timestamp=time.time(),
                    confidence=0.95
                )
                alerts.append(alert)
            elif density >= 0.7:
                alert = CongestionAlert(
                    node_id=node_data["id"],
                    node_name=node_name,
                    density=density,
                    alert_level=AlertLevel.HIGH,
                    message=f"High density at {node_data['id']}: {density:.0%}",
                    timestamp=time.time(),
                    confidence=0.85
                )
                alerts.append(alert)
        
        return alerts
    
    def _get_fallback_scenario(self) -> Dict:
        """Fallback scenario if JSON loading fails"""
        return {
            "name": "Fallback Scenario",
            "description": "Basic scenario for testing",
            "graph_config": {
                "nodes": [
                    {"id": "gate_main", "x": 20, "y": 50, "node_type": "gate", "capacity": 500, "density": 0.3, "trend": "stable"},
                    {"id": "concourse_center", "x": 50, "y": 50, "node_type": "concourse", "capacity": 800, "density": 0.5, "trend": "up"},
                    {"id": "exit_main", "x": 80, "y": 50, "node_type": "exit", "capacity": 400, "density": 0.2, "trend": "stable"}
                ],
                "edges": [
                    {"source": "gate_main", "target": "concourse_center", "capacity": 300, "flow_rate": 0.7},
                    {"source": "concourse_center", "target": "exit_main", "capacity": 350, "flow_rate": 0.6}
                ]
            },
            "events": []
        }

# Global instance
scenario_service = ScenarioService()
