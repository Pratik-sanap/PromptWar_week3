from unittest.mock import MagicMock, patch
from backend.ai import orchestration, client

def test_offline_fallback_navigation():
    # Patch configured check to return False (simulating missing key)
    with patch.object(client, "is_configured", return_value=False):
        res = orchestration.orchestrate_chat(
            message="where is the gate?",
            language="en",
            session_id="test-session",
            zone="zone_a",
            accessibility_needs={"wheelchair": False},
            history=[]
        )
        assert res is not None
        assert "Offline Mode" in res["reply"]
        assert res["structuredData"] is not None
        assert res["structuredData"]["type"] == "gate_recommendation"
        assert res["structuredData"]["data"]["gateName"] == "Gate B3"

def test_offline_fallback_unknown_message():
    with patch.object(client, "is_configured", return_value=False):
        res = orchestration.orchestrate_chat(
            message="hello there",
            language="es",
            session_id="test-session",
            zone="zone_a",
            accessibility_needs={"wheelchair": False},
            history=[]
        )
        assert res is not None
        assert "Offline Mode" in res["reply"]
        assert res["structuredData"] is None

@patch("google.generativeai.GenerativeModel")
def test_mocked_gemini_orchestration(mock_model_class):
    # Setup mock GenerativeModel and chat session
    mock_model = MagicMock()
    mock_model_class.return_value = mock_model
    
    mock_chat = MagicMock()
    mock_model.start_chat.return_value = mock_chat
    
    # Mock Gemini response
    mock_response = MagicMock()
    mock_response.text = "Mocked Gemini reply message."
    mock_response.function_calls = []
    mock_chat.send_message.return_value = mock_response
    
    with patch.object(client, "is_configured", return_value=True):
        res = orchestration.orchestrate_chat(
            message="hello assistant",
            language="en",
            session_id="test-session",
            zone="zone_a",
            accessibility_needs={"wheelchair": False},
            history=[]
        )
        assert res["reply"] == "Mocked Gemini reply message."
        assert res["structuredData"] is None

@patch("google.generativeai.GenerativeModel")
def test_mocked_gemini_tool_calling(mock_model_class):
    mock_model = MagicMock()
    mock_model_class.return_value = mock_model
    
    mock_chat = MagicMock()
    mock_model.start_chat.return_value = mock_chat
    
    # Mock first response requesting find_nearest_gate
    mock_call = MagicMock()
    mock_call.name = "find_nearest_gate"
    mock_call.args = {"zone": "zone_a", "accessible": True}
    
    mock_response_1 = MagicMock()
    mock_response_1.function_calls = [mock_call]
    
    # Mock second response returning final text
    mock_response_2 = MagicMock()
    mock_response_2.text = "Here is the nearest accessible gate: Gate A1."
    mock_response_2.function_calls = []
    
    mock_chat.send_message.side_effect = [mock_response_1, mock_response_2]
    
    with patch.object(client, "is_configured", return_value=True):
        res = orchestration.orchestrate_chat(
            message="where is the accessible gate?",
            language="en",
            session_id="test-session",
            zone="zone_a",
            accessibility_needs={"wheelchair": True},
            history=[]
        )
        assert res["reply"] == "Here is the nearest accessible gate: Gate A1."
        assert res["structuredData"] is not None
        assert res["structuredData"]["type"] == "gate_recommendation"
        assert res["structuredData"]["data"]["gateName"] == "Gate A1"

@patch("google.generativeai.GenerativeModel")
def test_mocked_gemini_api_exception_fallback(mock_model_class):
    mock_model = MagicMock()
    mock_model_class.return_value = mock_model
    
    mock_chat = MagicMock()
    mock_model.start_chat.return_value = mock_chat
    mock_chat.send_message.side_effect = Exception("API connection dropped")
    
    with patch.object(client, "is_configured", return_value=True):
        res = orchestration.orchestrate_chat(
            message="where is the gate?",
            language="en",
            session_id="test-session",
            zone="zone_a",
            accessibility_needs={"wheelchair": False},
            history=[]
        )
        assert "Offline Mode" in res["reply"]
        assert res["structuredData"] is not None
        assert res["structuredData"]["data"]["gateName"] == "Gate B3"
