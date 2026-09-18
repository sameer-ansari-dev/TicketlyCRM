# TicketlyCRM

TicketlyCRM is a responsive customer-support ticketing application for creating, prioritizing, and tracking customer issues. It pairs a React single-page interface with a FastAPI API and supports Supabase PostgreSQL in production or SQLite for local development.

## Features

- Create tickets with validated customer and issue details
- Search tickets by ID, customer name, email, subject, or description
- Filter tickets by status and priority
- Use a four-level priority system: Low, Medium, High, and Critical
- Add chronological internal ticket notes
- View dashboard analytics and status counts
- Receive same-tab updates immediately after ticket changes, with a five-second refresh fallback
- Attach JPG, PNG, PDF, DOC, or DOCX files up to 10 MB
- Use the interface comfortably on desktop and mobile layouts

## Tech stack

- React, Vite, and Tailwind CSS
- FastAPI, SQLAlchemy, and Pydantic
- Supabase PostgreSQL for production; SQLite for local development
- Vercel for deployment

## Project structure

```text
ticket-crm/
├── api/                 # Vercel ASGI entry point
├── backend/
│   ├── app/             # API routes, models, schemas, services, and utilities
│   ├── tests/           # API and Vercel-routing smoke tests
│   └── main.py          # FastAPI application
├── frontend/
│   ├── public/          # Favicons and web manifest
│   └── src/             # React UI, routes, and API client
├── schema/              # Base schema and Supabase migrations
├── docs/                # Deployment and Supabase guidance
├── .env.example         # Safe environment-variable template
├── package.json         # Root development, build, and test commands
└── vercel.json          # Vercel build and rewrite configuration
```

## Installation

### Prerequisites

- Node.js 18 or later
- Python 3.10 or later (3.12 recommended)

### Backend setup

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env  # Windows PowerShell: Copy-Item .env.example .env
npm run backend
```

The API runs at `http://localhost:8000`; interactive documentation is at `/docs`.

### Frontend setup

In a second terminal:

```bash
npm run install:frontend
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the local backend.

### Environment variables

Copy `.env.example` to `.env`. Do not commit `.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Production | Supabase PostgreSQL connection string; use the transaction pooler with `sslmode=require`. |
| `ENVIRONMENT` | No | Application environment label. |
| `CORS_ORIGINS` | No | Comma-separated frontend origins permitted to call the API. |
| `VITE_API_URL` | No | Explicit frontend API URL; omit for the Vercel same-origin `/api` route. |
| `UPLOAD_DIR` | No | Writable directory for attachments; defaults to `backend/static/uploads`. |

Without `DATABASE_URL`, local development uses the included SQLite database. Configure `DATABASE_URL` in Vercel rather than committing it to a file. See [Supabase setup](docs/supabase_setup.md) for migration guidance.

## Scripts and verification

```bash
npm run dev           # Start the Vite frontend
npm run backend       # Start FastAPI on port 8000
npm run build         # Create a production build
npm test              # Run backend API and Vercel routing checks
```

## API endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | API and database health status |
| `GET` | `/api/tickets` | List, search, filter, and sort tickets |
| `POST` | `/api/tickets` | Create a ticket |
| `GET` | `/api/tickets/stats/summary` | Dashboard ticket counts |
| `GET` | `/api/tickets/{ticket_id}` | Fetch ticket details, notes, and attachments |
| `PUT` | `/api/tickets/{ticket_id}` | Update ticket status or details |
| `POST` | `/api/tickets/{ticket_id}/notes` | Add an internal note |
| `POST` | `/api/tickets/{ticket_id}/attachments` | Upload an allowed attachment |

## Screenshots

Add reviewer-friendly screenshots here before publishing: dashboard, create-ticket form, ticket details/notes, and a mobile view. Store only deliberately curated image assets in the repository; user-uploaded files are excluded.

## Design decisions

### Why a priority system?

Support queues need a fast, visible way to decide what to address first. The Low-to-Critical scale makes triage understandable without requiring a separate SLA configuration interface. Priority is persisted, filterable, and included in dashboard data.

### Trade-off: refresh strategy

The current update strategy immediately synchronizes mounted views after a local mutation and polls every five seconds as a resilient fallback. It keeps the stack simple and works on serverless hosting, but it is not a multi-client push channel. WebSockets or Supabase Realtime would provide true cross-client, instant synchronization at the cost of connection and operational complexity.

## Future improvements

- Add role-based access control and a production identity provider
- Add WebSocket, Server-Sent Events, or Supabase Realtime for cross-client live updates
- Move attachment storage to object storage for durable serverless deployments
- Add automated browser tests and continuous integration
- Add a customer-facing status portal and email/webhook ingestion

## Author

Ansari Mohammed Sameer  
GitHub: [sameer-ansari-dev](https://github.com/sameer-ansari-dev)
