from typing import Dict, Any, List, Optional
from backend.data import db

VALID_ZONES = {"zone_a", "zone_b", "zone_c", "zone_d", "zone_e", "zone_f"}

def validate_zone(zone: str) -> None:
    if zone not in VALID_ZONES:
        raise ValueError(f"Invalid zone ID: {zone}. Must be one of {list(VALID_ZONES)}.")

def find_nearest_gate(zone: str, accessible: bool) -> Dict[str, Any]:
    """
    Finds the recommended gate for a given stadium zone and accessibility preference.
    
    Args:
        zone: The user's stadium zone (must be one of 'zone_a', 'zone_b', 'zone_c', 'zone_d', 'zone_e', 'zone_f').
        accessible: Set to True if wheelchair/flat pathway accessibility is required, False otherwise.
        
    Returns:
        A dictionary containing the recommended gate name, distance, queue wait status, and accessibility flag.
    """
    validate_zone(zone)
    gate = db.get_recommended_gate(zone, accessible)
    if not gate:
        return {"error": f"No gates found in zone {zone}."}
    return {
        "gateName": gate["name"],
        "distance": f"{gate['distance']}m",
        "queueStatus": gate["queue_status"],
        "accessible": gate["accessible"]
    }

def get_transport_options(zone: str) -> Dict[str, Any]:
    """
    Retrieves the available transportation modes (train, bus, shuttles) and line ETAs from a stadium zone.
    
    Args:
        zone: The stadium zone (must be one of 'zone_a', 'zone_b', 'zone_c', 'zone_d', 'zone_e', 'zone_f').
        
    Returns:
        A dictionary containing a list of transport options.
    """
    validate_zone(zone)
    transport_list = db.get_transport(zone)
    options = []
    for t in transport_list:
        options.append({
            "mode": t["mode"],
            "line": t["line"],
            "eta": t["eta"]
        })
    return {"options": options}

def get_crowd_density(zone: str) -> Dict[str, Any]:
    """
    Gets the current crowd density percentage occupancy and motion status for a stadium zone.
    
    Args:
        zone: The stadium zone (must be one of 'zone_a', 'zone_b', 'zone_c', 'zone_d', 'zone_e', 'zone_f').
        
    Returns:
        A dictionary containing the density level and movement status.
    """
    validate_zone(zone)
    density = db.get_crowd_density(zone)
    if not density:
        return {"error": f"No crowd data for zone {zone}."}
    return {
        "zone": zone.upper(),
        "density": density["density"],
        "status": density["status"]
    }

def get_accessibility_route(from_zone: str, to_gate: str) -> Dict[str, Any]:
    """
    Retrieves a step-by-step flat and ramp-accessible route description from a starting zone to a destination gate.
    
    Args:
        from_zone: The user's starting zone ID (one of 'zone_a', 'zone_b', etc.).
        to_gate: The destination gate name (e.g. 'Gate A1').
        
    Returns:
        A dictionary containing a step-by-step route array.
    """
    validate_zone(from_zone)
    # Simple semantic routing rules
    if from_zone == "zone_a":
        steps = [
            "Proceed from Zone A seats towards the North exit ramp.",
            "Take the flat marked walkway directly to the Gate A1 ticketing queue."
        ]
    elif from_zone == "zone_b":
        steps = [
            "Head to elevator B-2 on the East seating concourse.",
            "Take elevator down to Level 1.",
            "Follow the accessible blue pathway to Gate B2 entrance."
        ]
    else:
        steps = [
            f"Locate the nearest accessible directory map in {from_zone.upper()}.",
            "Use the elevator/ramp paths to descend to Level 1.",
            f"Follow the flat, wide paved corridor leading directly to {to_gate}."
        ]
    return {"route": steps}
