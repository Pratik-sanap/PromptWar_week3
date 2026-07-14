from backend.data import db

def test_db_loading():
    # Verify that mock data arrays are populated
    assert len(db.get_gates()) > 0
    assert len(db.get_zones()) > 0
    
def test_get_transport():
    # Verify transport lookup filters by zone
    opts = db.get_transport("zone_a")
    assert len(opts) > 0
    for opt in opts:
        assert opt["zone"] == "zone_a"

def test_get_crowd_density():
    # Verify crowd lookup returns correct record
    density = db.get_crowd_density("zone_b")
    assert density is not None
    assert density["zone"] == "zone_b"
    assert "density" in density
    assert "status" in density

def test_get_crowd_density_unknown_zone():
    # Edge case: unknown zone ID should return None
    assert db.get_crowd_density("unknown_zone") is None
