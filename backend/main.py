import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import chat, health

load_dotenv()

app = FastAPI(
    title="FIFA 2026 Smart Stadium Concierge Backend",
    description="API and orchestration backend for the Smart Stadium Concierge application.",
    version="1.0.0"
)

# CORS configuration (security.md §4)
# Read allowed origins from env; default to dev origins.
_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")
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
    return {"message": "FIFA 2026 Stadium Concierge API. Use /api/health or POST /api/chat."}

if __name__ == "__main__":
    import uvicorn
    # Start ASGI server on port 5000 (proxied by frontend dev server)
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
