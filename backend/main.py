import os
import sys
from datetime import datetime, timezone

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError, OperationalError, IntegrityError

from app.api.tickets import router as ticket_router
from app.database.database import engine, Base, IS_POSTGRES, ensure_ticket_priority_schema, ensure_ticket_sequence, test_connection
from app.models.attachment import Attachment  # Registers attachment metadata before create_all.

# Safe table creation on startup (logs warning instead of crashing on temporary network glitch)
try:
    Base.metadata.create_all(bind=engine)
    ensure_ticket_priority_schema()
    ensure_ticket_sequence()
except Exception as exc:
    print(f"[Warning] Could not auto-create database tables on startup: {exc}")

app = FastAPI(
    title="TicketlyCRM API",
    version="1.0.0",
    description="A production-ready Customer Support Management API built for TicketlyCRM with ticket operations, internal notes, search, filtering, and metric tracking."
)

uploads_dir = os.getenv("UPLOAD_DIR", os.path.join(backend_dir, "static", "uploads"))
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Global Database Exception Handlers
@app.exception_handler(OperationalError)
async def operational_error_handler(request: Request, exc: OperationalError):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": "Database connection error. Please verify Supabase credentials and network availability.",
            "error": str(exc.orig) if hasattr(exc, "orig") else str(exc),
        }
    )

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": "Database constraint violation (duplicate key or foreign key violation).",
            "error": str(exc.orig) if hasattr(exc, "orig") else str(exc),
        }
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal database error occurred.",
            "error_type": type(exc).__name__,
        }
    )

configured_origins = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
}
configured_origins.update(
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
)

# Same-origin Vercel deployments do not need CORS. Add trusted origins only when
# the API is also consumed by a separate frontend or local development client.
app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers (supporting both /api/tickets and /tickets for local dev & Vercel serverless rewrites)
app.include_router(ticket_router, prefix="/api")
app.include_router(ticket_router)


@app.get("/", tags=["Health"])
@app.get("/health", tags=["Health"])
@app.get("/api", tags=["Health"])
@app.get("/api/health", tags=["Health"])
@app.get("/api/index.py", tags=["Health"])
@app.get("/api/index", tags=["Health"])
def health_check():
    db_status = test_connection()
    return {
        "api": "operational",
        "database": "connected" if db_status.get("connected") else "disconnected",
        "database_type": "Supabase PostgreSQL" if IS_POSTGRES else db_status.get("engine", "Database"),
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
