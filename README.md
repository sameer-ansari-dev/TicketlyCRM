# TicketlyCRM

TicketlyCRM is a customer-support ticket management CRM built for the Datastraw Technical Assessment. It gives support teams a focused workspace for creating, prioritizing, searching, updating, and resolving customer tickets.

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
**Author:** Ansari Mohammed Sameer  
**Stack:** React, Vite, TailwindCSS, FastAPI, SQLAlchemy, Supabase PostgreSQL, Vercel

## Documentation

| Document | Audience | Contents |
| --- | --- | --- |
| [Full Project Documentation](docs/PROJECT_DOCUMENTATION.md) | Reviewers and stakeholders | Product scope, architecture, features, database, API, UI, workflow, testing, and deployment |
| [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md) | Engineers | Runtime design, routes, data contracts, configuration, operations, and trade-offs |
| [User Documentation](docs/USER_DOCUMENTATION.md) | Support agents | Login, ticket triage, notes, attachments, analytics, settings, and troubleshooting |
| [Datastraw Submission Notes](docs/DATASTRAW_SUBMISSION_NOTES.md) | Company reviewer | Assessment summary, design decisions, verification evidence, and limitations |
| [Supabase Setup](docs/supabase_setup.md) | Maintainers | Database provisioning and migration guidance |

## Quick Start

Prerequisites: Node.js 18+, Python 3.10+, and a Supabase PostgreSQL connection for production. Local development falls back to SQLite when `DATABASE_URL` is absent.

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env

npm run backend       # FastAPI: http://localhost:8000
npm run dev           # Vite: http://localhost:5173
```

Open `http://localhost:5173`. The Vite proxy forwards `/api` requests to port `8000`. FastAPI interactive documentation is available at `http://localhost:8000/docs`.

## Core Features

- Ticket creation with validated customer and issue data
- Low, Medium, High, and Critical priority management
- Search by ticket ID, customer, email, subject, or description
- Status filtering and priority sorting
- Status and priority updates
- Internal notes and supported file attachments up to 10 MB
- Dashboard KPIs and analytics charts
- Responsive desktop and mobile layouts
- Local browser authentication with session expiry and logout confirmation
- Health monitoring from the Settings page

## API Summary

The backend exposes `/api/health`, ticket listing and creation, ticket details, updates, statistics, notes, and attachments. There is currently no DELETE endpoint; deletion is intentionally outside the present MVP scope.

## Security Note

Never commit `.env` or database credentials. Use `.env.example` as the template and configure production secrets in Vercel. Any credential that has been exposed outside a secure secret manager should be rotated before deployment.

## Verification

```powershell
python -m compileall -q backend main.py api
npm --prefix frontend run build
python backend/tests/test_api.py
python backend/tests/test_vercel_routing.py
```

## Repository Layout

```text
api/                 Vercel ASGI entry point
backend/             FastAPI application, services, models, schemas, tests
frontend/            React/Vite application
schema/              PostgreSQL schema and migrations
docs/                Project, technical, user, and submission documentation
vercel.json          Vercel build and rewrite configuration
```

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
