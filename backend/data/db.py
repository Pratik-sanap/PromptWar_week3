import json
import os
from typing import Any, Dict, List, Optional

# Global cache for mock data loaded once at startup
_GATES: List[Dict[str, Any]] = []
_ZONES: List[Dict[str, Any]] = []
_TRANSPORT: List[Dict[str, Any]] = []
_CROWD_DENSITY: List[Dict[str, Any]] = []


def init_db() -> None:
    """
    Initializes mock data by loading gates, zones, transport, and crowd data from JSON files.
    """
    global _GATES, _ZONES, _TRANSPORT, _CROWD_DENSITY

    current_dir = os.path.dirname(os.path.abspath(__file__))

    with open(os.path.join(current_dir, "gates.json"), "r", encoding="utf-8") as f:
        _GATES = json.load(f)

    with open(os.path.join(current_dir, "zones.json"), "r", encoding="utf-8") as f:
        _ZONES = json.load(f)

    with open(os.path.join(current_dir, "transport.json"), "r", encoding="utf-8") as f:
        _TRANSPORT = json.load(f)

    with open(
        os.path.join(current_dir, "crowd_density.json"), "r", encoding="utf-8"
    ) as f:
        _CROWD_DENSITY = json.load(f)


# Auto-initialize on load
init_db()


def get_gates() -> List[Dict[str, Any]]:
    """
    Retrieves the list of all stadium gates.

    Returns:
        List[Dict[str, Any]]: List of gate definitions.
    """
    return _GATES


def get_zones() -> List[Dict[str, Any]]:
    """
    Retrieves the list of all stadium zones.

    Returns:
        List[Dict[str, Any]]: List of zone definitions.
    """
    return _ZONES


def get_transport(zone_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves the list of transport options for a specific zone.

    Args:
        zone_id (str): The identifier of the stadium zone.

    Returns:
        List[Dict[str, Any]]: List of transport options for that zone.
    """
    return [t for t in _TRANSPORT if t["zone"] == zone_id]


def get_crowd_density(zone_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves the crowd density details for a specific zone.

    Args:
        zone_id (str): The identifier of the stadium zone.

    Returns:
        Optional[Dict[str, Any]]: The crowd density dictionary, or None if not found.
    """
    for d in _CROWD_DENSITY:
        if d["zone"] == zone_id:
            return d
    return None


def get_recommended_gate(
    zone_id: str, wheelchair_accessible: bool
) -> Optional[Dict[str, Any]]:
    """
    Recommends a gate for the given zone, prioritizing accessibility and low queue wait times.

    Args:
        zone_id (str): The identifier of the stadium zone.
        wheelchair_accessible (bool): Whether wheelchair-accessible routes are required.

    Returns:
        Optional[Dict[str, Any]]: The recommended gate dictionary, or None if not found.
    """
    # 1. Filter gates in the requested zone
    zone_gates = [g for g in _GATES if g["zone"] == zone_id]
    if not zone_gates:
        return None

    if wheelchair_accessible:
        # Filter for accessible gates only
        accessible_gates = [g for g in zone_gates if g["accessible"]]
        if not accessible_gates:
            # Fallback to nearest gate in the zone if no accessible gate exists
            return min(zone_gates, key=lambda g: g["distance"])
        return min(accessible_gates, key=lambda g: g["distance"])

    # Standard logic
    nearest_gate = min(zone_gates, key=lambda g: g["distance"])

    # If nearest gate has a high queue, check for alternates in the same zone
    if nearest_gate["queue_status"] != "High":
        return nearest_gate

    alternates = [
        g
        for g in zone_gates
        if g["id"] != nearest_gate["id"]
        and g["queue_status"] in ("Low", "Medium")
        and g["distance"] <= nearest_gate["distance"] + 100
    ]
    if alternates:
        # Return the nearest alternate gate with Low/Medium wait
        return min(alternates, key=lambda g: g["distance"])

    return nearest_gate
