import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.tickets import router as ticket_router
from app.database.database import engine, Base

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TicketlyCRM API",
    version="1.0.0",
    description="A production-ready Customer Support Management API built for TicketlyCRM with ticket operations, internal notes, search, filtering, and metric tracking."
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(ticket_router)


@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "TicketlyCRM Backend",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)