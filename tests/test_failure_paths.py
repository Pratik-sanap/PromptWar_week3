"""
Failure-Path Integration Tests

Verifies the full chain's failure behavior end-to-end:
1. Gemini API failure → user gets documented fallback, not a crash.
2. Missing API key → offline fallback with 200 OK.
3. Unexpected exception in orchestration → 500 with safe message.
"""
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.main import app
from backend.routes.chat import _rate_limit_store

client = TestClient(app)

VALID_PAYLOAD = {
    "message": "Where is the nearest gate?",
    "language": "en",
    "sessionId": "session-failure-test",
    "zone": "zone_a",
    "accessibilityNeeds": {"wheelchair": False, "visual": False},
    "history": []
}


class TestGeminiApiFails:
    """When orchestrate_chat raises, the endpoint returns a safe 500."""

    def test_unexpected_exception_returns_500(self):
        _rate_limit_store.clear()

        with patch(
            "backend.routes.chat.orchestration.orchestrate_chat",
            side_effect=RuntimeError("Simulated Gemini outage")
        ):
            response = client.post("/api/chat", json=VALID_PAYLOAD)

        assert response.status_code == 500
        body = response.json()
        assert "detail" in body
        assert "unexpected error" in body["detail"].lower()
        # Must NOT leak the actual exception message (security.md §4)
        assert "Simulated Gemini outage" not in body["detail"]


class TestOfflineFallback:
    """When the API key is missing, orchestration returns an offline reply (200)."""

    def test_missing_key_returns_offline_reply(self):
        _rate_limit_store.clear()

        with patch("backend.ai.client.is_configured", return_value=False):
            response = client.post("/api/chat", json=VALID_PAYLOAD)

        assert response.status_code == 200
        body = response.json()
        assert "reply" in body
        assert "Offline Mode" in body["reply"]

    def test_offline_reply_includes_structured_data_for_gate_query(self):
        _rate_limit_store.clear()

        with patch("backend.ai.client.is_configured", return_value=False):
            response = client.post("/api/chat", json=VALID_PAYLOAD)

        body = response.json()
        assert body.get("structuredData") is not None
        assert body["structuredData"]["type"] == "gate_recommendation"


class TestGeminiFallbackOnException:
    """When Gemini raises inside orchestrate_chat, the function itself
    catches and returns the offline fallback (200) — not a 500."""

    def test_gemini_exception_triggers_fallback(self):
        _rate_limit_store.clear()

        # Patch at a deeper level: make the Gemini model raise, but let
        # orchestrate_chat's own try/except handle it (returns offline reply).
        with patch(
            "backend.ai.orchestration.genai.GenerativeModel",
            side_effect=Exception("Network timeout talking to Gemini")
        ), patch("backend.ai.client.is_configured", return_value=True):
            response = client.post("/api/chat", json=VALID_PAYLOAD)

        assert response.status_code == 200
        body = response.json()
        assert "reply" in body
        # Should be the offline fallback, not a traceback
        assert "Offline Mode" in body["reply"]


class TestValidationErrors:
    """Frontend receives clean 422 errors for bad input, not crashes."""

    def test_invalid_zone_returns_422(self):
        payload = {**VALID_PAYLOAD, "zone": "zone_z"}
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 422

    def test_invalid_language_returns_422(self):
        payload = {**VALID_PAYLOAD, "language": "de"}
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 422

    def test_oversized_message_returns_422(self):
        payload = {**VALID_PAYLOAD, "message": "a" * 501}
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 422
