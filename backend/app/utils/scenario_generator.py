"""
Scenario Generator - Creates 100 diverse venue scenarios
"""

import json
import random
from typing import List, Dict, Any

class ScenarioGenerator:
    def __init__(self):
        self.node_types = ["gate", "concourse", "concession", "exit", "sector"]
        self.trends = ["up", "down", "stable"]
        self.phases = ["normal", "halftime", "post_match", "concert", "emergency"]
        
    def generate_node(self, node_id: str, node_type: str, x: float, y: float, 
                     base_capacity: int, density_range: tuple) -> Dict[str, Any]:
        """Generate a single node with realistic parameters"""
        density = random.uniform(*density_range)
        capacity = base_capacity + random.randint(-50, 50)
        
        node = {
            "id": node_id,
            "x": x,
            "y": y,
            "node_type": node_type,
            "capacity": capacity,
            "density": round(density, 2),
            "trend": random.choice(self.trends)
        }
        
        # Add predicted density for high-density nodes
        if density > 0.7:
            node["predicted_density"] = round(density + random.uniform(-0.1, 0.1), 2)
        
        return node
    
    def generate_edge(self, source: str, target: str, base_capacity: int, 
                     flow_multiplier: float = 1.0) -> Dict[str, Any]:
        """Generate a single edge with realistic parameters"""
        return {
            "source": source,
            "target": target,
            "capacity": base_capacity + random.randint(-30, 30),
            "flow_rate": round(random.uniform(0.3, 0.9) * flow_multiplier, 2),
            "is_saturated": random.random() < 0.3
        }
    
    def generate_normal_scenario(self, scenario_id: int) -> Dict[str, Any]:
        """Generate normal operations scenario"""
        density_ranges = [(0.2, 0.4), (0.25, 0.45), (0.3, 0.5)]
        base_density = random.choice(density_ranges)
        
        nodes = []
        # Gates
        for i in range(2):
            nodes.append(self.generate_node(
                f"gate_{chr(110+i)}", "gate", 20, 40 + i*20, 450, base_density
            ))
        
        # Concourses
        for i in range(3):
            nodes.append(self.generate_node(
                f"concourse_{chr(110+i)}", "concourse", 40 + i*10, 30 + i*10, 700, 
                (base_density[0] + 0.1, base_density[1] + 0.1)
            ))
        
        # Concessions
        for i in range(2):
            nodes.append(self.generate_node(
                f"concession_{chr(110+i)}", "concession", 35, 20 + i*40, 180,
                (base_density[0] + 0.15, base_density[1] + 0.15)
            ))
        
        # Exits
        for i in range(2):
            nodes.append(self.generate_node(
                f"exit_{chr(110+i)}", "exit", 80, 25 + i*30, 380, (0.15, 0.25)
            ))
        
        edges = []
        # Connect gates to concourses (multiple paths)
        edges.append(self.generate_edge("gate_n", "concourse_n", 250))
        edges.append(self.generate_edge("gate_s", "concourse_s", 250))
        edges.append(self.generate_edge("gate_n", "concourse_c", 200))  # Cross connections
        edges.append(self.generate_edge("gate_s", "concourse_c", 200))
        
        # Connect concourses (multiple paths)
        edges.append(self.generate_edge("concourse_n", "concourse_c", 350))
        edges.append(self.generate_edge("concourse_s", "concourse_c", 350))
        edges.append(self.generate_edge("concourse_c", "concourse_e", 300))
        edges.append(self.generate_edge("concourse_n", "concourse_e", 250))  # Direct paths
        edges.append(self.generate_edge("concourse_s", "concourse_e", 250))
        edges.append(self.generate_edge("concourse_n", "concourse_s", 200))  # Cross concourse
        
        # Connect concessions to concourses
        edges.append(self.generate_edge("concourse_n", "concession_n", 150))
        edges.append(self.generate_edge("concourse_s", "concession_s", 150))
        edges.append(self.generate_edge("concourse_c", "concession_n", 120))
        edges.append(self.generate_edge("concourse_c", "concession_s", 120))
        
        # Connect concourses to exits (multiple paths)
        edges.append(self.generate_edge("concourse_n", "exit_n", 180))
        edges.append(self.generate_edge("concourse_s", "exit_s", 180))
        edges.append(self.generate_edge("concourse_c", "exit_n", 150))
        edges.append(self.generate_edge("concourse_c", "exit_s", 150))
        edges.append(self.generate_edge("concourse_e", "exit_n", 120))
        edges.append(self.generate_edge("concourse_e", "exit_s", 120))
        
        return {
            "name": f"Normal Operations - Variant {scenario_id}",
            "description": f"Standard venue operations scenario {scenario_id}",
            "graph_config": {"nodes": nodes, "edges": edges},
            "events": []
        }
    
    def generate_halftime_scenario(self, scenario_id: int) -> Dict[str, Any]:
        """Generate halftime rush scenario"""
        nodes = []
        
        # Gates (low density)
        nodes.append(self.generate_node("gate_main", "gate", 20, 50, 500, (0.1, 0.2)))
        
        # Concourses (high density)
        concourse_positions = [(35, 30), (35, 70), (50, 50), (65, 30), (65, 70)]
        for i, (x, y) in enumerate(concourse_positions):
            nodes.append(self.generate_node(
                f"concourse_{chr(110+i)}", "concourse", x, y, 750, (0.75, 0.95)
            ))
        
        # Concessions (very high density)
        for i in range(4):
            nodes.append(self.generate_node(
                f"concession_{chr(110+i)}", "concession", 40 + i*10, 25 + (i%2)*40, 200, (0.85, 0.98)
            ))
        
        # Exits (low density)
        for i in range(3):
            nodes.append(self.generate_node(
                f"exit_{chr(110+i)}", "exit", 75 + i*5, 20 + i*25, 400, (0.1, 0.2)
            ))
        
        edges = []
        # Multiple paths between all concourses (many saturated)
        for i in range(4):
            edges.append(self.generate_edge(f"concourse_{chr(110+i)}", "concourse_c", 300, 0.5))
            edges[-1]["is_saturated"] = True
            # Additional paths
            edges.append(self.generate_edge(f"concourse_{chr(110+i)}", "concourse_c", 250, 0.4))
            edges[-1]["is_saturated"] = True
        
        # Cross connections between concourses
        edges.append(self.generate_edge("concourse_n", "concourse_s", 200, 0.3))
        edges[-1]["is_saturated"] = True
        edges.append(self.generate_edge("concourse_n", "concourse_e", 180, 0.4))
        edges[-1]["is_saturated"] = True
        edges.append(self.generate_edge("concourse_s", "concourse_e", 180, 0.4))
        edges[-1]["is_saturated"] = True
        
        # Connect concessions to concourses (high traffic)
        for i in range(4):
            edges.append(self.generate_edge(f"concourse_{chr(110+i)}", f"concession_{chr(110+i)}", 120, 0.6))
            edges[-1]["is_saturated"] = True
        
        # Connect to exits (some capacity)
        for i in range(3):
            edges.append(self.generate_edge("concourse_c", f"exit_{chr(110+i)}", 200, 0.7))
            edges.append(self.generate_edge("concourse_e", f"exit_{chr(110+i)}", 180, 0.6))
        
        return {
            "name": f"Halftime Rush - Variant {scenario_id}",
            "description": f"Peak congestion during halftime scenario {scenario_id}",
            "graph_config": {"nodes": nodes, "edges": edges},
            "events": [
                {"timestamp": f"2024-01-{15 + (scenario_id % 15):02d}T15:15:00Z", "type": "congestion_spike", "node_id": "concourse_c", "severity": "high"},
                {"timestamp": f"2024-01-{15 + (scenario_id % 15):02d}T15:16:00Z", "type": "queue_formation", "node_id": "concession_n", "length": 40 + scenario_id}
            ]
        }
    
    def generate_concert_scenario(self, scenario_id: int) -> Dict[str, Any]:
        """Generate concert scenario"""
        nodes = []
        
        # Entrances
        nodes.append(self.generate_node("main_entrance", "gate", 15, 50, 800, (0.6, 0.8)))
        nodes.append(self.generate_node("vip_entrance", "gate", 15, 25, 200, (0.3, 0.5)))
        
        # Standing/seating areas
        area_types = ["standing", "seated", "vip"]
        for i, area_type in enumerate(area_types):
            capacity = 1200 if area_type == "standing" else (800 if area_type == "seated" else 300)
            density = (0.8, 0.95) if area_type == "standing" else ((0.7, 0.85) if area_type == "seated" else (0.4, 0.6))
            nodes.append(self.generate_node(
                f"area_{area_type}_{i+1}", "sector", 35 + i*10, 35 + i*10, capacity, density
            ))
        
        # Bars and concessions
        for i in range(3):
            nodes.append(self.generate_node(
                f"bar_{chr(110+i)}", "concession", 55 + i*8, 30 + i*15, 150, (0.8, 0.95)
            ))
        
        # Merch booth
        nodes.append(self.generate_node("merch_booth", "concession", 70, 50, 100, (0.7, 0.85)))
        
        # Emergency exits
        for i in range(3):
            nodes.append(self.generate_node(
                f"emergency_exit_{i+1}", "exit", 75 + i*5, 15 + i*25, 400, (0.2, 0.3)
            ))
        
        edges = []
        # Multiple paths from main entrance
        edges.append(self.generate_edge("main_entrance", "area_standing_1", 500))
        edges.append(self.generate_edge("main_entrance", "area_seated_2", 400))
        edges.append(self.generate_edge("main_entrance", "area_vip_3", 200))
        
        # VIP entrance paths
        edges.append(self.generate_edge("vip_entrance", "area_vip_3", 150))
        edges.append(self.generate_edge("vip_entrance", "area_seated_2", 100))
        
        # Cross connections between areas
        edges.append(self.generate_edge("area_standing_1", "area_seated_2", 300))
        edges.append(self.generate_edge("area_seated_2", "area_vip_3", 150))
        edges.append(self.generate_edge("area_standing_1", "area_vip_3", 200))
        
        # Connect areas to bars and concessions
        edges.append(self.generate_edge("area_standing_1", "bar_n", 120))
        edges.append(self.generate_edge("area_standing_1", "bar_o", 100))
        edges.append(self.generate_edge("area_seated_2", "bar_o", 100))
        edges.append(self.generate_edge("area_seated_2", "bar_p", 120))
        edges.append(self.generate_edge("area_vip_3", "bar_p", 80))
        edges.append(self.generate_edge("area_vip_3", "merch_booth", 60))
        
        # Connect to emergency exits
        edges.append(self.generate_edge("area_standing_1", "emergency_exit_1", 200))
        edges.append(self.generate_edge("area_seated_2", "emergency_exit_2", 180))
        edges.append(self.generate_edge("area_vip_3", "emergency_exit_3", 150))
        edges.append(self.generate_edge("bar_n", "emergency_exit_1", 100))
        edges.append(self.generate_edge("merch_booth", "emergency_exit_3", 80))
        
        return {
            "name": f"Concert Mode - Variant {scenario_id}",
            "description": f"Dynamic concert scenario {scenario_id}",
            "graph_config": {"nodes": nodes, "edges": edges},
            "events": [
                {"timestamp": f"2024-01-{15 + (scenario_id % 15):02d}T20:00:00Z", "type": "show_start", "node_id": "main_stage", "impact": "high"},
                {"timestamp": f"2024-01-{15 + (scenario_id % 15):02d}T20:15:00Z", "type": "crowd_surge", "node_id": "area_standing_1", "intensity": 0.8}
            ]
        }
    
    def generate_emergency_scenario(self, scenario_id: int) -> Dict[str, Any]:
        """Generate emergency evacuation scenario"""
        nodes = []
        
        # Main affected area
        nodes.append(self.generate_node(
            "affected_area", "sector", 40, 50, 2500, (0.9, 0.98)
        ))
        
        # Emergency exits (high utilization)
        for i in range(5):
            nodes.append(self.generate_node(
                f"emergency_exit_{i+1}", "exit", 20 + i*15, 20 + (i%2)*50, 500, (0.7, 0.9)
            ))
        
        # Assembly points
        for i in range(3):
            nodes.append(self.generate_node(
                f"assembly_point_{i+1}", "sector", 85, 20 + i*20, 1000, (0.2, 0.4)
            ))
        
        # Medical station
        nodes.append(self.generate_node("medical_station", "sector", 70, 50, 100, (0.3, 0.5)))
        
        edges = []
        # Multiple evacuation paths from affected area
        for i in range(5):
            edges.append(self.generate_edge("affected_area", f"emergency_exit_{i+1}", 600, 0.8))
            edges[-1]["is_saturated"] = True
            # Additional backup paths
            edges.append(self.generate_edge("affected_area", f"emergency_exit_{i+1}", 400, 0.6))
            edges[-1]["is_saturated"] = True
        
        # Cross connections between emergency exits
        for i in range(4):
            edges.append(self.generate_edge(f"emergency_exit_{i+1}", f"emergency_exit_{i+2}", 300, 0.4))
            edges[-1]["is_saturated"] = True
        
        # Multiple paths to assembly points
        for i in range(3):
            edges.append(self.generate_edge(f"emergency_exit_{i+1}", f"assembly_point_{i+1}", 800, 0.9))
            edges.append(self.generate_edge(f"emergency_exit_{i+1+2}", f"assembly_point_{i+1}", 600, 0.7))
            edges.append(self.generate_edge(f"emergency_exit_{i+1}", f"assembly_point_{(i%3)+1}", 500, 0.6))
        
        # Medical station connections
        edges.append(self.generate_edge("affected_area", "medical_station", 200, 0.3))
        edges.append(self.generate_edge("emergency_exit_3", "medical_station", 150, 0.4))
        edges.append(self.generate_edge("assembly_point_2", "medical_station", 300, 0.5))
        
        return {
            "name": f"Emergency Evacuation - Variant {scenario_id}",
            "description": f"Emergency evacuation scenario {scenario_id}",
            "graph_config": {"nodes": nodes, "edges": edges},
            "events": [
                {"timestamp": f"2024-01-{15 + (scenario_id % 15):02d}T16:45:00Z", "type": "emergency_alert", "node_id": "all_venues", "severity": "critical"},
                {"timestamp": f"2024-01-{15 + (scenario_id % 15):02d}T16:46:00Z", "type": "evacuation_initiated", "node_id": "affected_area", "protocol": "emergency"}
            ]
        }
    
    def generate_post_match_scenario(self, scenario_id: int) -> Dict[str, Any]:
        """Generate post-match egress scenario"""
        nodes = []
        
        # All concourses at maximum capacity
        concourse_positions = [(30, 30), (30, 50), (30, 70), (50, 40), (50, 60)]
        for i, (x, y) in enumerate(concourse_positions):
            nodes.append(self.generate_node(
                f"concourse_{chr(110+i)}", "concourse", x, y, 800, (0.95, 1.0)
            ))
        
        # Exits (high density)
        for i in range(4):
            nodes.append(self.generate_node(
                f"exit_{chr(110+i)}", "exit", 70 + i*5, 20 + i*20, 450, (0.8, 0.95)
            ))
        
        # Alternate exits (lower density)
        for i in range(2):
            nodes.append(self.generate_node(
                f"alt_exit_{i+1}", "exit", 60, 10 + i*70, 300, (0.3, 0.5)
            ))
        
        edges = []
        # Saturated main routes (multiple paths)
        for i in range(5):
            for j in range(4):
                edges.append(self.generate_edge(f"concourse_{chr(110+i)}", f"exit_{chr(110+j)}", 350, 0.3))
                edges[-1]["is_saturated"] = True
                # Additional backup paths
                edges.append(self.generate_edge(f"concourse_{chr(110+i)}", f"exit_{chr(110+j)}", 250, 0.2))
                edges[-1]["is_saturated"] = True
        
        # Cross connections between concourses (saturated)
        for i in range(4):
            edges.append(self.generate_edge(f"concourse_{chr(110+i)}", f"concourse_{chr(111+i)}", 300, 0.4))
            edges[-1]["is_saturated"] = True
            edges.append(self.generate_edge(f"concourse_{chr(110+i)}", f"concourse_{chr(112+i)}", 250, 0.3))
            edges[-1]["is_saturated"] = True
        
        # Connections to alternate exits (some capacity)
        for i in range(5):
            for j in range(2):
                edges.append(self.generate_edge(f"concourse_{chr(110+i)}", f"alt_exit_{j+1}", 200, 0.6))
        
        # Cross connections between main and alternate exits
        for i in range(4):
            for j in range(2):
                edges.append(self.generate_edge(f"exit_{chr(110+i)}", f"alt_exit_{j+1}", 150, 0.5))
        
        return {
            "name": f"Post-Match Egress - Variant {scenario_id}",
            "description": f"Critical post-match egress scenario {scenario_id}",
            "graph_config": {"nodes": nodes, "edges": edges},
            "events": [
                {"timestamp": f"2024-01-{15 + (scenario_id % 15):02d}T17:00:00Z", "type": "critical_congestion", "node_id": "concourse_c", "severity": "critical"},
                {"timestamp": f"2024-01-{15 + (scenario_id % 15):02d}T17:01:00Z", "type": "egress_initiated", "node_id": "all_concourses", "phase": "post_match"}
            ]
        }
    
    def generate_all_scenarios(self, count: int = 100) -> Dict[str, Any]:
        """Generate all scenarios"""
        scenarios = {}
        
        # Distribute scenario types
        normal_count = count // 4  # 25%
        halftime_count = count // 5  # 20%
        concert_count = count // 5  # 20%
        emergency_count = count // 10  # 10%
        post_match_count = count // 10  # 10%
        
        # Generate scenarios
        scenario_id = 1
        
        # Normal operations
        for i in range(normal_count):
            scenarios[f"normal_operations_{scenario_id}"] = self.generate_normal_scenario(scenario_id)
            scenario_id += 1
        
        # Halftime rush
        for i in range(halftime_count):
            scenarios[f"halftime_rush_{scenario_id}"] = self.generate_halftime_scenario(scenario_id)
            scenario_id += 1
        
        # Concert mode
        for i in range(concert_count):
            scenarios[f"concert_mode_{scenario_id}"] = self.generate_concert_scenario(scenario_id)
            scenario_id += 1
        
        # Emergency evacuation
        for i in range(emergency_count):
            scenarios[f"emergency_evacuation_{scenario_id}"] = self.generate_emergency_scenario(scenario_id)
            scenario_id += 1
        
        # Post-match egress
        for i in range(post_match_count):
            scenarios[f"post_match_egress_{scenario_id}"] = self.generate_post_match_scenario(scenario_id)
            scenario_id += 1
        
        # Fill remaining with random scenarios
        while len(scenarios) < count:
            scenario_type = random.choice(["normal", "halftime", "concert", "emergency", "post_match"])
            if scenario_type == "normal":
                scenarios[f"normal_operations_{scenario_id}"] = self.generate_normal_scenario(scenario_id)
            elif scenario_type == "halftime":
                scenarios[f"halftime_rush_{scenario_id}"] = self.generate_halftime_scenario(scenario_id)
            elif scenario_type == "concert":
                scenarios[f"concert_mode_{scenario_id}"] = self.generate_concert_scenario(scenario_id)
            elif scenario_type == "emergency":
                scenarios[f"emergency_evacuation_{scenario_id}"] = self.generate_emergency_scenario(scenario_id)
            else:
                scenarios[f"post_match_egress_{scenario_id}"] = self.generate_post_match_scenario(scenario_id)
            scenario_id += 1
        
        # Create rotation config
        weights = {}
        for key in scenarios.keys():
            if "normal" in key:
                weights[key] = 0.25 / normal_count
            elif "halftime" in key:
                weights[key] = 0.20 / halftime_count
            elif "concert" in key:
                weights[key] = 0.20 / concert_count
            elif "emergency" in key:
                weights[key] = 0.10 / emergency_count
            elif "post_match" in key:
                weights[key] = 0.10 / post_match_count
            else:
                weights[key] = 0.15 / (count - normal_count - halftime_count - concert_count - emergency_count - post_match_count)
        
        return {
            "scenarios": scenarios,
            "scenario_rotation": {
                "enabled": True,
                "interval_minutes": 1,  # Rotate every minute for demo variety
                "randomize": True,
                "weights": weights
            }
        }

def main():
    """Generate and save 100 scenarios"""
    generator = ScenarioGenerator()
    scenarios_data = generator.generate_all_scenarios(100)
    
    # Save to file
    output_file = "/Users/meharkapoor7/venue-nexus/data/demo_scenarios_100.json"
    with open(output_file, 'w') as f:
        json.dump(scenarios_data, f, indent=2)
    
    print(f"✅ Generated {len(scenarios_data['scenarios'])} diverse scenarios")
    print(f"📁 Saved to: {output_file}")
    print(f"🔄 Rotation interval: 1 minute")
    
    # Print scenario distribution
    scenario_types = {}
    for key in scenarios_data['scenarios'].keys():
        if "normal" in key:
            scenario_types["normal"] = scenario_types.get("normal", 0) + 1
        elif "halftime" in key:
            scenario_types["halftime"] = scenario_types.get("halftime", 0) + 1
        elif "concert" in key:
            scenario_types["concert"] = scenario_types.get("concert", 0) + 1
        elif "emergency" in key:
            scenario_types["emergency"] = scenario_types.get("emergency", 0) + 1
        elif "post_match" in key:
            scenario_types["post_match"] = scenario_types.get("post_match", 0) + 1
    
    print("📊 Scenario distribution:")
    for scenario_type, count in scenario_types.items():
        print(f"  • {scenario_type}: {count}")

if __name__ == "__main__":
    main()
