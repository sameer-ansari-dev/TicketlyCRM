import asyncio
import os
import sys

# Ensure project root is in sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from api.index import app


async def simulate_request(path: str, headers: dict = None):
    raw_headers = []
    if headers:
        for k, v in headers.items():
            raw_headers.append((k.encode("utf-8"), v.encode("utf-8")))

    scope = {
        "type": "http",
        "method": "GET",
        "path": path,
        "raw_path": path.encode("utf-8"),
        "headers": raw_headers,
        "query_string": b"",
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80),
    }

    response_status = None
    response_body = []

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(message):
        nonlocal response_status
        if message["type"] == "http.response.start":
            response_status = message["status"]
        elif message["type"] == "http.response.body":
            response_body.append(message.get("body", b""))

    await app(scope, receive, send)
    return response_status, b"".join(response_body).decode("utf-8", errors="ignore")


async def main():
    print("Testing Vercel Serverless Function Routing:")

    # 1. Direct path /api/health
    s1, b1 = await simulate_request("/api/health")
    print(f"1. Direct /api/health -> Status: {s1}")
    assert s1 == 200, f"Expected 200, got {s1}"

    # 2. Vercel internal rewrite path /api/index.py with x-matched-path: /api/tickets
    s2, b2 = await simulate_request("/api/index.py", headers={"x-matched-path": "/api/tickets"})
    print(f"2. Rewritten /api/index.py with x-matched-path: /api/tickets -> Status: {s2}")
    assert s2 == 200, f"Expected 200, got {s2}"
    assert "ticket_id" in b2, "Expected ticket_id in response body"

    # 3. Vercel internal rewrite path /api/index.py with x-forwarded-uri: /api/tickets/stats/summary
    s3, b3 = await simulate_request("/api/index.py", headers={"x-forwarded-uri": "/api/tickets/stats/summary"})
    print(f"3. Rewritten /api/index.py with x-forwarded-uri: /api/tickets/stats/summary -> Status: {s3}")
    assert s3 == 200, f"Expected 200, got {s3}"
    assert "total" in b3, "Expected total in response body"

    # 4. Direct /api/index.py fallback to health check
    s4, b4 = await simulate_request("/api/index.py")
    print(f"4. Direct /api/index.py -> Status: {s4}")
    assert s4 == 200, f"Expected 200, got {s4}"

    print("\nALL VERCEL ROUTING SIMULATION TESTS PASSED PERFECTLY!")


if __name__ == "__main__":
    asyncio.run(main())
