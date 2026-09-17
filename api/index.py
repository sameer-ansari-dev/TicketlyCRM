"""
Vercel Serverless Function Entrypoint for TicketlyCRM FastAPI Backend
=====================================================================
This module is invoked by Vercel's Python runtime (@vercel/python)
for all requests matching the `/api/(.*)` rewrite in vercel.json.
"""

import os
import sys

# Set up system paths so that both `backend` and root modules are accessible
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import FastAPI application
try:
    from backend.main import app as _app
except ImportError:
    from main import app as _app  # Fallback if invoked from within backend


class VercelPathFixMiddleware:
    """
    ASGI Middleware that restores the original request path when Vercel's internal
    rewrites route requests using the destination path (/api/index.py).
    Extracts the true client path from `x-matched-path` or `x-forwarded-uri`.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            path = scope.get("path", "")
            # If Vercel routed to the literal file destination path
            if path in ("/api/index.py", "/api/index", "/index.py"):
                headers = dict(scope.get("headers", []))
                matched = (
                    headers.get(b"x-matched-path", b"")
                    or headers.get(b"x-forwarded-uri", b"")
                    or headers.get(b"x-invoke-path", b"")
                ).decode("utf-8", errors="ignore")

                if matched:
                    clean_path = matched.split("?")[0]
                    if clean_path and clean_path not in ("/api/index.py", "/api/index", "/index.py"):
                        scope["path"] = clean_path

        await self.app(scope, receive, send)


app = VercelPathFixMiddleware(_app)

__all__ = ["app"]
