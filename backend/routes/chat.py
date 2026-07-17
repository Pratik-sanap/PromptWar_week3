import logging
import time
from typing import Any, Dict, List, Optional

import constants
from ai import orchestration
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)
router = APIRouter()

# Rate limit store: sessionId -> list of request timestamps
_rate_limit_store: Dict[str, List[float]] = {}


class ChatRequest(BaseModel):
    """
    Data model representing a chat request payload.
    """

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
        if v not in constants.VALID_ZONES:
            raise ValueError(f"Zone must be one of {constants.VALID_ZONES}")
        return v


def check_rate_limit(session_id: str) -> None:
    """
    Enforces a rate limit for each user session based on request timestamps.

    Args:
        session_id (str): The unique user session identifier.
    """
    now = time.time()
    timestamps = _rate_limit_store.get(session_id, [])

    # Filter out timestamps older than the window
    timestamps = [t for t in timestamps if now - t < constants.RATE_LIMIT_WINDOW]

    if len(timestamps) >= constants.RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before sending another message.",
        )

    timestamps.append(now)
    _rate_limit_store[session_id] = timestamps


@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Receives chat message, enforces rate limits, and orchestrates the AI chat loop.

    Args:
        request (ChatRequest): The incoming request payload.

    Returns:
        Dict: AI concierge reply and structured visual data if available.
    """
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
            history=request.history or [],
        )
        return res

    except HTTPException as he:
        # Re-raise HTTPExceptions to let FastAPI handle them (e.g. rate limit, bad request)
        raise he
    except Exception as e:
        # Log error details server-side
        logger.exception("CRITICAL ERROR in /api/chat: %s", e)
        # Return a safe, generic error message to client (security.md)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later.",
        )
