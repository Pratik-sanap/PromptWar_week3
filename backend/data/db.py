import os
import json
from typing import List, Dict, Any, Optional

# Global cache for mock data loaded once at startup
_GATES: List[Dict[str, Any]] = []
_ZONES: List[Dict[str, Any]] = []
_TRANSPORT: List[Dict[str, Any]] = []
_CROWD_DENSITY: List[Dict[str, Any]] = []

def init_db():
    global _GATES, _ZONES, _TRANSPORT, _CROWD_DENSITY
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    with open(os.path.join(current_dir, 'gates.json'), 'r', encoding='utf-8') as f:
        _GATES = json.load(f)
        
    with open(os.path.join(current_dir, 'zones.json'), 'r', encoding='utf-8') as f:
        _ZONES = json.load(f)
        
    with open(os.path.join(current_dir, 'transport.json'), 'r', encoding='utf-8') as f:
        _TRANSPORT = json.load(f)
        
    with open(os.path.join(current_dir, 'crowd_density.json'), 'r', encoding='utf-8') as f:
        _CROWD_DENSITY = json.load(f)

# Auto-initialize on load
init_db()

def get_gates() -> List[Dict[str, Any]]:
    return _GATES

def get_zones() -> List[Dict[str, Any]]:
    return _ZONES

def get_transport(zone_id: str) -> List[Dict[str, Any]]:
    return [t for t in _TRANSPORT if t['zone'] == zone_id]

def get_crowd_density(zone_id: str) -> Optional[Dict[str, Any]]:
    for d in _CROWD_DENSITY:
        if d['zone'] == zone_id:
            return d
    return None

def get_recommended_gate(zone_id: str, wheelchair_accessible: bool) -> Optional[Dict[str, Any]]:
    # 1. Filter gates in the requested zone
    zone_gates = [g for g in _GATES if g['zone'] == zone_id]
    if not zone_gates:
        return None
        
    if wheelchair_accessible:
        # Filter for accessible gates only
        accessible_gates = [g for g in zone_gates if g['accessible']]
        if not accessible_gates:
            # Fallback to nearest gate in the zone if no accessible gate exists
            return min(zone_gates, key=lambda g: g['distance'])
        return min(accessible_gates, key=lambda g: g['distance'])
    else:
        # Standard logic
        nearest_gate = min(zone_gates, key=lambda g: g['distance'])
        
        # If nearest gate has a high queue, check for alternates in the same zone
        if nearest_gate['queue_status'] == 'High':
            alternates = [
                g for g in zone_gates 
                if g['id'] != nearest_gate['id'] 
                and g['queue_status'] in ('Low', 'Medium')
                and g['distance'] <= nearest_gate['distance'] + 100
            ]
            if alternates:
                # Return the nearest alternate gate with Low/Medium wait
                return min(alternates, key=lambda g: g['distance'])
                
        return nearest_gate
