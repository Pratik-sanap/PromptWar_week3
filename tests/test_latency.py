"""
Latency & Loading-State Check (efficiency.md §3/§6)

Tests that the full chat round-trip completes within demoable time.
"""
import time
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.main import app
from backend.routes.chat import _rate_limit_store

client = TestClient(app)

VALID_PAYLOAD = {
    "message": "Where is the nearest gate?",
    "language": "en",
    "sessionId": "session-latency-test",
    "zone": "zone_a",
    "accessibilityNeeds": {"wheelchair": False, "visual": False},
    "history": []
}


def test_offline_fallback_responds_fast():
    """When Gemini key is missing, the offline fallback must respond in < 500ms."""
    _rate_limit_store.clear()

    with patch("backend.ai.client.is_configured", return_value=False):
        start = time.perf_counter()
        response = client.post("/api/chat", json=VALID_PAYLOAD)
        elapsed = time.perf_counter() - start

    assert response.status_code == 200
    assert "reply" in response.json()
    assert elapsed < 0.5, f"Offline fallback took {elapsed:.2f}s — should be < 0.5s"


def test_round_trip_under_threshold():
    """
    Full round-trip (with or without Gemini) must complete in < 10s.
    When Gemini is configured this tests actual API latency;
    when it's not it still exercises the full request pipeline.
    """
    _rate_limit_store.clear()

    start = time.perf_counter()
    response = client.post("/api/chat", json=VALID_PAYLOAD)
    elapsed = time.perf_counter() - start

    assert response.status_code == 200
    assert "reply" in response.json()
    # Generous limit — live Gemini may take a few seconds; offline is instant
    assert elapsed < 10.0, f"Round-trip took {elapsed:.2f}s — should be < 10s for demo"
    print(f"Round-trip latency: {elapsed:.3f}s")
