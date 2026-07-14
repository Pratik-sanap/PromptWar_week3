from fastapi.testclient import TestClient
from backend.main import app
from backend.routes.chat import _rate_limit_store

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_chat_valid_payload():
    payload = {
        "message": "tell me about the gate",
        "language": "en",
        "sessionId": "session-123",
        "zone": "zone_a",
        "accessibilityNeeds": {"wheelchair": False, "visual": False},
        "history": []
    }
    # Clear rate limit store for clean run
    _rate_limit_store.clear()
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    assert "reply" in response.json()

def test_chat_invalid_language():
    payload = {
        "message": "hello",
        "language": "de",  # German not allowed
        "sessionId": "session-123",
        "zone": "zone_a",
        "accessibilityNeeds": {"wheelchair": False},
        "history": []
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 422  # Validation error

def test_chat_invalid_zone():
    payload = {
        "message": "hello",
        "language": "en",
        "sessionId": "session-123",
        "zone": "zone_z",  # Zone Z not allowed
        "accessibilityNeeds": {"wheelchair": False},
        "history": []
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 422  # Validation error

def test_chat_oversized_message():
    payload = {
        "message": "a" * 501,  # 501 chars (limit is 500)
        "language": "en",
        "sessionId": "session-123",
        "zone": "zone_a",
        "accessibilityNeeds": {"wheelchair": False},
        "history": []
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 422  # Validation error

def test_chat_rate_limiting():
    payload = {
        "message": "hello",
        "language": "en",
        "sessionId": "session-rate-limit",
        "zone": "zone_a",
        "accessibilityNeeds": {"wheelchair": False},
        "history": []
    }
    _rate_limit_store.clear()
    
    # Send 5 requests (all should pass)
    for _ in range(5):
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 200
        
    # 6th request should be rate-limited (429)
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 429
    assert "Rate limit exceeded" in response.json()["detail"]
