from backend.data import db

def test_recommendation_standard_near():
    # In Zone A, Gate A1 (75m, Low queue) is closest and healthy
    gate = db.get_recommended_gate("zone_a", wheelchair_accessible=False)
    assert gate is not None
    assert gate["name"] == "Gate A1"

def test_recommendation_rerouting_due_to_queue():
    # In Zone B:
    # - Gate B1 (80m) has High queue
    # - Gate B2 (120m) has Low queue
    # - Gate B3 (130m) has Medium queue
    # Since nearest is High queue, we should reroute to Gate B2 (closest alternate under 80m + 100m)
    gate = db.get_recommended_gate("zone_b", wheelchair_accessible=False)
    assert gate is not None
    assert gate["name"] == "Gate B2"  # Rerouted from B1 to B2

def test_recommendation_accessible():
    # In Zone B, requesting accessibility should return Gate B2 (which is accessible=True),
    # even though B1 is closer (80m) but accessible=False.
    gate = db.get_recommended_gate("zone_b", wheelchair_accessible=True)
    assert gate is not None
    assert gate["accessible"] is True
    assert gate["name"] == "Gate B2"
