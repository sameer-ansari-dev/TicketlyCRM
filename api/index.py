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
    from backend.main import app
except ImportError:
    from main import app  # Fallback if invoked from within backend

# Export app for Vercel ASGI handler
__all__ = ["app"]
