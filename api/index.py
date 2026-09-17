"""
Vercel Serverless Function Entrypoint for TicketlyCRM FastAPI Backend
=====================================================================
This module is invoked by Vercel's Python runtime (@vercel/python)
for all requests matching the `/api/(.*)` rewrite in vercel.json.
"""

import os
import sys
import traceback

# Set up system paths so that both `backend` and root modules are accessible
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

for p in [root_dir, backend_dir, current_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

startup_error = None
_app = None

try:
    try:
        from backend.main import app as _app
    except (ImportError, ModuleNotFoundError):
        from main import app as _app
except Exception:
    startup_error = traceback.format_exc()
    print(f"[Vercel Startup Error]\n{startup_error}")


if startup_error:
    async def app(scope, receive, send):
        if scope.get("type") == "http":
            body = (
                f"TICKETLY CRM STARTUP ERROR\n"
                f"{'=' * 50}\n\n"
                f"{startup_error}\n\n"
                f"DEBUG INFO:\n"
                f"Python: {sys.version}\n"
                f"Current Dir: {current_dir}\n"
                f"Root Dir: {root_dir}\n"
                f"Root Files: {os.listdir(root_dir) if os.path.exists(root_dir) else 'NOT FOUND'}\n"
                f"Backend Files: {os.listdir(backend_dir) if os.path.exists(backend_dir) else 'NOT FOUND'}\n"
                f"DATABASE_URL Present: {'DATABASE_URL' in os.environ}\n"
            ).encode("utf-8")
            await send({
                "type": "http.response.start",
                "status": 500,
                "headers": [
                    (b"content-type", b"text/plain; charset=utf-8"),
                    (b"content-length", str(len(body)).encode("utf-8")),
                ],
            })
            await send({
                "type": "http.response.body",
                "body": body,
            })
else:
    class VercelPathFixMiddleware:
        """
        ASGI Middleware that restores the original request path when Vercel's internal
        rewrites route requests using the destination path (/api/index.py).
        Extracts the true client path from `x-matched-path` or `x-forwarded-uri`.
        """
        def __init__(self, inner_app):
            self.inner_app = inner_app

        async def __call__(self, scope, receive, send):
            if scope.get("type") == "http":
                path = scope.get("path", "")
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

            try:
                await self.inner_app(scope, receive, send)
            except Exception:
                err = traceback.format_exc()
                print(f"[Vercel Request Error]\n{err}")
                if scope.get("type") == "http":
                    body = f"TICKETLY CRM REQUEST HANDLER ERROR\n{'=' * 50}\n\n{err}".encode("utf-8")
                    await send({
                        "type": "http.response.start",
                        "status": 500,
                        "headers": [
                            (b"content-type", b"text/plain; charset=utf-8"),
                            (b"content-length", str(len(body)).encode("utf-8")),
                        ],
                    })
                    await send({
                        "type": "http.response.body",
                        "body": body,
                    })

    app = VercelPathFixMiddleware(_app)

__all__ = ["app"]
