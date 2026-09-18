"""Local-development ASGI entry point.

This keeps `python -m uvicorn main:app --reload --port 8000` working from the
repository root while Vercel continues to use the existing backend app.
"""

from backend.main import app

__all__ = ["app"]
