import logging
from fastapi import APIRouter, HTTPException, status
from data import db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    """
    Health check endpoint to verify backend system status.

    Returns:
        dict[str, str]: Status of the backend.
    """
    try:
        # Verify db is properly loaded
        gates = db.get_gates()
        if not gates:
            raise ValueError("No gates data found in database")
        return {"status": "ok", "message": "FIFA 2026 Concierge Backend is healthy."}
    except Exception as e:
        logger.exception("CRITICAL ERROR in /api/health: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later.",
        )
