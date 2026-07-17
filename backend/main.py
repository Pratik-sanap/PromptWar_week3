import os
import sys

# Ensure the backend directory is in sys.path so relative imports work
# when running: python main.py  (from inside the backend/ folder)
sys.path.insert(0, os.path.dirname(__file__))

import constants
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import chat, health

load_dotenv()

app = FastAPI(
    title="FIFA 2026 Smart Stadium Concierge Backend",
    description="API and orchestration backend for the Smart Stadium Concierge application.",
    version="1.0.0",
)

# CORS configuration (security.md §4)
# Read allowed origins from env; default to dev origins.
origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", constants.DEFAULT_CORS_ORIGINS).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# Include route routers (guidelines.md)
app.include_router(health.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/")
async def root():
    """
    Returns the root welcoming message of the API.

    Returns:
        Dict: A welcome message detailing endpoints.
    """
    return {
        "message": "FIFA 2026 Stadium Concierge API. Use /api/health or POST /api/chat."
    }


if __name__ == "__main__":
    import uvicorn

    # Start ASGI server on port 5000 (proxied by frontend dev server)
    uvicorn.run(
        "main:app",
        host=constants.DEFAULT_HOST,
        port=constants.DEFAULT_PORT,
        reload=True,
    )
