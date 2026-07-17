from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint to verify backend system status.

    Returns:
        Dict: Status of the backend.
    """
    return {"status": "ok", "message": "FIFA 2026 Concierge Backend is healthy."}
