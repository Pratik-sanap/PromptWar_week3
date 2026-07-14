import time
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from backend.ai import orchestration

router = APIRouter()

# Rate limit store: sessionId -> list of request timestamps
_rate_limit_store: Dict[str, List[float]] = {}
RATE_LIMIT_WINDOW = 10.0  # seconds
RATE_LIMIT_MAX_REQUESTS = 5

class ChatRequest(BaseModel):
    message: str = Field(..., max_length=500)
    language: str
    sessionId: str
    zone: str
    accessibilityNeeds: Dict[str, bool]
    history: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        allowed = {"en", "es", "fr", "ar"}
        if v not in allowed:
            raise ValueError(f"Language must be one of {allowed}")
        return v

    @field_validator("zone")
    @classmethod
    def validate_zone(cls, v: str) -> str:
        allowed = {"zone_a", "zone_b", "zone_c", "zone_d", "zone_e", "zone_f"}
        if v not in allowed:
            raise ValueError(f"Zone must be one of {allowed}")
        return v

def check_rate_limit(session_id: str) -> None:
    now = time.time()
    timestamps = _rate_limit_store.get(session_id, [])
    
    # Filter out timestamps older than the window
    timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    
    if len(timestamps) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before sending another message."
        )
        
    timestamps.append(now)
    _rate_limit_store[session_id] = timestamps

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    # Enforce per-session rate limit
    check_rate_limit(request.sessionId)
    
    try:
        # Pass payload to the AI orchestration layer
        res = orchestration.orchestrate_chat(
            message=request.message,
            language=request.language,
            session_id=request.sessionId,
            zone=request.zone,
            accessibility_needs=request.accessibilityNeeds,
            history=request.history or []
        )
        return res
        
    except HTTPException as he:
        # Re-raise HTTPExceptions to let FastAPI handle them (e.g. rate limit, bad request)
        raise he
    except Exception as e:
        # Log error details server-side
        print(f"CRITICAL ERROR in /api/chat: {e}")
        # Return a safe, generic error message to client (security.md)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later."
        )
