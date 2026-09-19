import os
import sys
import logging
import tempfile
from uuid import uuid4
from datetime import datetime, timezone

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError, OperationalError, IntegrityError

from app.api.tickets import router as ticket_router
from app.database.database import engine, Base, IS_POSTGRES, IS_SERVERLESS, ensure_ticket_priority_schema, ensure_ticket_sequence, test_connection
from app.models.attachment import Attachment  # Registers attachment metadata before create_all.

logger = logging.getLogger("ticketlycrm.api")

# Safe table creation on startup (logs warning instead of crashing on temporary network glitch)
try:
    Base.metadata.create_all(bind=engine)
    ensure_ticket_priority_schema()
    ensure_ticket_sequence()
except Exception as exc:
    logger.exception("Database schema initialization failed; requests will return a structured database error")

app = FastAPI(
    title="TicketlyCRM API",
    version="1.0.0",
    description="A production-ready Customer Support Management API built for TicketlyCRM with ticket operations, internal notes, search, filtering, and metric tracking."
)

# Vercel deploys application files under the read-only /var/task directory.
# Runtime uploads must use the serverless temporary directory instead.
default_upload_dir = (
    os.path.join(tempfile.gettempdir(), "ticketlycrm-uploads")
    if IS_SERVERLESS
    else os.path.join(backend_dir, "static", "uploads")
)
uploads_dir = os.getenv("UPLOAD_DIR", default_upload_dir)
os.makedirs(uploads_dir, exist_ok=True)
logger.info("Attachment storage initialized serverless=%s path=%s", IS_SERVERLESS, uploads_dir)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Global Database Exception Handlers
@app.exception_handler(OperationalError)
async def operational_error_handler(request: Request, exc: OperationalError):
    request_id = request.headers.get("x-vercel-id", uuid4().hex)
    logger.exception("Database operation failed request_id=%s path=%s", request_id, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": "Database service is unavailable. Please try again shortly.",
            "code": "DATABASE_UNAVAILABLE",
            "request_id": request_id,
        }
    )

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    request_id = request.headers.get("x-vercel-id", uuid4().hex)
    logger.exception("Database integrity error request_id=%s path=%s", request_id, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": "The request conflicts with existing ticket data.",
            "code": "DATABASE_CONFLICT",
            "request_id": request_id,
        }
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
    request_id = request.headers.get("x-vercel-id", uuid4().hex)
    logger.exception("Unexpected database error request_id=%s path=%s", request_id, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal database error occurred.",
            "code": "DATABASE_ERROR",
            "request_id": request_id,
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = request.headers.get("x-vercel-id", uuid4().hex)
    body = None
    try:
        body = await request.json()
    except Exception:
        try:
            raw = await request.body()
            body = raw.decode("utf-8", errors="ignore")
        except Exception:
            body = "<unavailable>"

    failed_fields = [
        ".".join(str(loc) for loc in err.get("loc", []) if loc != "body")
        for err in exc.errors()
    ]
    logger.warning(
        "Request validation error (422) request_id=%s method=%s path=%s failed_fields=%s errors=%s body=%s",
        request_id,
        request.method,
        request.url.path,
        failed_fields,
        exc.errors(),
        body,
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY if hasattr(status, "HTTP_422_UNPROCESSABLE_ENTITY") else 422,
        content={
            "detail": exc.errors(),
            "failed_fields": failed_fields,
            "message": f"Validation failed for fields: {', '.join(failed_fields) if failed_fields else 'unknown'}",
        },
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
    logger.info("Health check database_connected=%s database_type=%s", db_status.get("connected"), db_status.get("engine"))
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
