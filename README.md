# TicketlyCRM - Customer Support Ticketing System

A full-stack, production-ready Customer Support Management application built for **TicketlyCRM**. It enables support teams to manage high-volume customer inquiries, triage issues, track SLAs, update resolution statuses, and collaborate via chronological team activity notes.

![TicketlyCRM Banner](docs/architecture.png)

---

## Live Demo & Repository Links

- **Repository**: [GitHub Repository](https://github.com/sameer-ansari/ticket-crm) *(Ready to push)*
- **Demo Video**: Located in [`demo-video/demo.mp4`](demo-video/demo.mp4)
- **Interactive OpenAPI Documentation**: `http://localhost:8000/docs`

---

## Key Features Built

| # | Feature | Specification | Implementation Details |
|---|---|---|---|
| **1** | **Create Tickets** | Name, email, title, description, auto ID & timestamp | Validated form with priority selector, collision-free auto-generated IDs (`TKT-XXXX`), and instant redirect. |
| **2** | **List All Tickets** | Clean list/table view | Responsive dark-slate table displaying ID, Customer, Subject, Status badge, Priority, and formatted dates. |
| **3** | **Search Functionality** | Quick search as you type | Debounced real-time query across customer names, ticket IDs, customer emails, subjects, and descriptions. |
| **4** | **Filter by Status** | Filter by Open, In Progress, Closed | Segmented pill controls with live counters for `All`, `Open`, `In Progress`, and `Closed`. |
| **5** | **View & Update** | Detailed view, update status, add notes | Full detail view, one-click status updater, chronological team notes timeline, and instant note submission. |
| **+** | **Standout: SLA & Priority** | Operational triage capability | Priority levels (`Low`, `Medium`, `High`, `Urgent`) with color-coded badges and response time guidelines. |
| **+** | **Standout: CSV Export** | Reporting & audit capability | Client-side export to standard `.csv` for all filtered/searched records. |
| **+** | **Standout: Seed Engine** | Realistic data on first launch | Automated database seeder populating realistic enterprise support tickets and multi-party notes. |

---

## Architectural Decisions & Tech Stack

```
   ┌────────────────────────────────────────────────────────┐
   │                  React 18 + Vite + Tailwind CSS        │
   │  • Lucide React Icons    • React Router v6    • Axios  │
   └───────────────────────────┬────────────────────────────┘
                               │ HTTP / JSON REST
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                  FastAPI (Python 3.14 / 3.11)          │
   │  • Pydantic v2 validation      • CORSMiddleware        │
   │  • Auto OpenAPI / Swagger docs • Modular Routers       │
   └───────────────────────────┬────────────────────────────┘
                               │ SQLAlchemy 2.0 ORM
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                  SQLite / PostgreSQL Database          │
   │  • 'tickets' table  (ticket_id, status, priority, ...) │
   │  • 'notes' table    (ticket_id FK, note_text, ...)     │
   └────────────────────────────────────────────────────────┘
```

### Why This Stack?
- **Backend: FastAPI + SQLAlchemy + SQLite**:
  FastAPI provides automatic OpenAPI schema generation, strict Pydantic data validation, and asynchronous high performance. SQLite with SQLAlchemy ORM enables zero-config deployment while keeping the schema 100% compatible with PostgreSQL for enterprise scale.
- **Frontend: React + Vite + Tailwind CSS**:
  Vite provides instant sub-second Hot Module Replacement (HMR) and optimized build bundles. Tailwind CSS allows rapid crafting of a custom, accessible dark-slate UI without heavy CSS runtime overhead.
- **Standout Trade-offs Made**:
  Rather than adding shallow auth that complicates evaluation, we invested engineering effort into **multi-field search**, **priority SLA indicators**, **rich note collaboration timelines**, and **one-click CSV data export**—features that support teams handling hundreds of tickets actually rely on every single day.

---

## Database Schema Design

The relational database uses two tables linked via a Foreign Key with `CASCADE` deletion:

```sql
-- Tickets Table
CREATE TABLE tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id VARCHAR(32) NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Open',
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notes Table
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id VARCHAR(32) NOT NULL,
    note_text TEXT NOT NULL,
    author VARCHAR(100) NOT NULL DEFAULT 'Support Agent',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
);
```
Complete DDL script is available in [`database/schema.sql`](database/schema.sql).

---

## Quickstart & Local Setup

### Prerequisites
- **Python 3.10+** (tested on 3.11 / 3.14)
- **Node.js 18+** & **npm**

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Seed realistic demo tickets and notes
python -m app.database.init_db

# Run automated backend test suite
python tests/test_api.py

# Start FastAPI development server
python -m uvicorn main:app --reload --port 8000
```
Backend will be live at: `http://localhost:8000`  
Swagger UI docs: `http://localhost:8000/docs`

---

### 2. Frontend Setup
```bash
# In a separate terminal, navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend will be live at: `http://localhost:5173`

---

## REST API Summary

Full documentation is available in [`docs/api_documentation.md`](docs/api_documentation.md).

| Method | Endpoint | Description | Request / Query | Response |
|---|---|---|---|---|
| `POST` | `/api/tickets` | Create a ticket | `{ customer_name, customer_email, subject, description }` | `{ ticket_id, created_at }` |
| `GET` | `/api/tickets` | List tickets | `?status=Open&search=query` | `[{ ticket_id, customer_name, subject, status, created_at, ... }]` |
| `GET` | `/api/tickets/{ticket_id}` | Get ticket details | N/A | `{ ticket_id, customer_name, subject, description, status, notes }` |
| `PUT` | `/api/tickets/{ticket_id}` | Update status & notes | `{ status, notes }` | `{ success: true, updated_at }` |
| `POST` | `/api/tickets/{ticket_id}/notes` | Append note | `{ note_text }` | `{ id, ticket_id, note_text, author, created_at }` |
| `GET` | `/api/tickets/stats/summary` | Aggregate metrics | N/A | `{ total, open, in_progress, closed }` |

---

## Railway Deployment

The repository is configured as a single Railway service. [`Dockerfile`](Dockerfile) builds the React frontend and runs FastAPI, which serves both the SPA and `/api/*` routes from the same origin. [`railway.json`](railway.json) configures the Docker builder and `/health` health check.

1. Create a new Railway project and deploy this repository.
2. Add `DATABASE_URL` as a Railway variable. Use a Railway PostgreSQL or Supabase PostgreSQL connection string for persistent production data.
3. Redeploy and open the generated public domain. The health check is available at `/health` and API documentation at `/docs`.

SQLite remains available for local development, but Railway containers have ephemeral filesystems, so it should not be used as the production database.

**Docker:** Run the complete app containerized:
  ```bash
  docker build -t support-crm .
  docker run -p 8000:8000 support-crm
  ```

---

## Submission Checklist

- [x] **Full-Stack Application**: FastAPI backend, SQLite database, React 18 frontend.
- [x] **Core Features**:
  - [x] Create Tickets (with auto ID generation and validation)
  - [x] List All Tickets (clean UI, responsive)
  - [x] Search Functionality (live multi-field search across ID, name, email, subject, description)
  - [x] Filter by Status (Open, In Progress, Closed)
  - [x] View & Update Tickets (status toggle, chronological team notes)
- [x] **Standout Features**: Priority SLA tags, live debounce, CSV export, realistic seed data.
- [x] **API & Schemas**: Clean 2-table schema in `database/schema.sql`, OpenAPI documentation in `docs/api_documentation.md`.
- [x] **Tests**: Automated integration test suite passing in `backend/tests/test_api.py`.
- [x] **Configuration**: `.env.example`, `.gitignore`, `railway.json`, and `Dockerfile`.
- [x] **Demo Video**: Stored in `demo-video/demo.mp4`.
