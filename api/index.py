import os
import sys
from urllib.parse import parse_qs

# Set up system paths so that both `backend` and root modules are accessible
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

for p in [root_dir, backend_dir, current_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.main import app as backend_app


class VercelPathMiddleware:
    def __init__(self, application):
        self.application = application

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http" and scope.get("path") in {
            "/api/index.py",
            "/api/index",
            "/index.py",
        }:
            headers = dict(scope.get("headers", []))
            query_path = parse_qs(
                scope.get("query_string", b"").decode("utf-8", errors="ignore")
            ).get("path", [""])[0]
            original_path = (
                query_path
                or headers.get(b"x-matched-path", b"")
                or headers.get(b"x-forwarded-uri", b"")
                or headers.get(b"x-invoke-path", b"")
            ).decode("utf-8", errors="ignore")
            if original_path:
                scope["path"] = original_path.split("?", 1)[0]

        await self.application(scope, receive, send)


app = VercelPathMiddleware(backend_app)

__all__ = ["app"]
