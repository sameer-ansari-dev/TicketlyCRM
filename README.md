# TicketlyCRM

A modern, high-performance Customer Support Management CRM engineered for fast-paced support teams. TicketlyCRM streamlines inbound inquiry tracking, issue triage, SLA monitoring, and collaborative team communication through chronological ticket activity logs.

Designed with a cloud-native, decoupled full-stack architecture, TicketlyCRM pairs a fast **React + Vite** single-page application with an asynchronous **FastAPI** backend, fully configured for global serverless deployment on **Vercel** backed by **Supabase PostgreSQL** (or local SQLite for zero-config development).

---

## Features

- **Create Tickets**: Form validation with client/server schema enforcement, priority selector, automated collision-free ID generation (`TKT-XXXX`), and instant redirect.
- **List Tickets**: Responsive, modern data table featuring customer avatars, subject previews, status badges, priority indicators, and relative timestamps.
- **Search Tickets**: Instant real-time multi-field search querying customer name, customer email, ticket ID, subject line, and full description text.
- **Filter by Status**: Segmented filter controls with dynamic count badges for `All`, `Open`, `In Progress`, and `Closed` tickets.
- **View Ticket Details**: Comprehensive issue view displaying customer metadata, operational status, priority level, creation/update timestamps, and resolution history.
- **Update Status**: One-click status transitions (`Open` → `In Progress` → `Closed`) with optimistic UI feedback and persistent audit timestamps.
- **Notes System**: Chronological internal communication timeline allowing agents to add notes, document root causes, and track triage updates.
- **Priority System**: Triage system with color-coded badges (`Low`, `Medium`, `High`, `Urgent`) and SLA response time guidelines.
- **Data Analytics & Export**: Metric summary cards (Total, Open, In Progress, Closed) and client-side CSV data export.

---

## Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) | High-speed build tooling and component-driven SPA interface |
| **Styling** | [TailwindCSS](https://tailwindcss.com/) | Utility-first, responsive slate UI design system |
| **Icons & UI** | [Lucide React](https://lucide.dev/) + [Framer Motion](https://www.framer.com/motion/) | Consistent iconography and smooth micro-interactions |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/) | Asynchronous, high-performance Python web framework |
| **Data Validation** | [Pydantic v2](https://docs.pydantic.dev/) + Email Validator | Robust data validation and automatic OpenAPI generation |
| **Database ORM** | [SQLAlchemy 2.0](https://www.sqlalchemy.org/) | Relational database mapping with NullPool for serverless |
| **Databases** | [Supabase](https://supabase.com/) PostgreSQL / SQLite | Production cloud PostgreSQL (via transaction pooler) & local SQLite |
| **Deployment** | [Vercel](https://vercel.com/) | Global Edge CDN for SPA + Python Serverless Functions for API |

---

## Project Structure

```text
ticketly-crm/
├── api/
│   └── index.py               # Vercel Serverless Function entry point & ASGI path restoration
├── backend/
│   ├── app/
│   │   ├── api/               # FastAPI route controllers (tickets, notes, stats)
│   │   ├── database/          # Database connection, pooling, migration utilities
│   │   ├── models/            # SQLAlchemy ORM models (Ticket, Note)
│   │   ├── schemas/           # Pydantic request/response validation schemas
│   │   ├── services/          # Business logic and database query operations
│   │   └── utils/             # Ticket ID generator and helpers
│   ├── database/
│   │   └── support_crm.db     # Seed SQLite database for local development
│   ├── tests/
│   │   ├── test_api.py        # Automated backend integration test suite
│   │   └── test_vercel_routing.py # Vercel ASGI rewrite & routing simulation tests
│   ├── main.py                # Standalone FastAPI application
│   └── requirements.txt       # Backend Python dependencies
├── frontend/
│   ├── public/                # Static assets (favicons, manifest)
│   ├── src/
│   │   ├── components/        # React components (Dashboard, Tickets, Details, etc.)
│   │   ├── js/                # Axios API client with dynamic base URL detection
│   │   ├── App.jsx            # Application root component
│   │   ├── index.css          # Tailwind CSS directives and custom styles
│   │   └── main.jsx           # React DOM mounting entry point
│   ├── package.json           # Frontend dependencies & scripts
│   └── vite.config.js         # Vite configuration with local dev proxy
├── schema/
│   ├── schema.sql             # Standard SQLite / PostgreSQL table schema
│   └── supabase_schema.sql    # Supabase PostgreSQL schema with indexes
├── .env.example               # Root environment variable template
├── .python-version            # Pins Python 3.12 for Vercel Python runtime
├── package.json               # Root monorepo orchestration scripts
├── requirements.txt           # Root Python dependencies for Vercel builder
└── vercel.json                # Vercel build, output, and serverless rewrites configuration
```

---

## Local Development Setup

### Prerequisites
- **Node.js 18+** & **npm**
- **Python 3.10+** (Python 3.12 recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/sameer-ansari/ticket-crm.git
cd ticket-crm
```

### 2. Backend Setup
```bash
# Optional: Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run automated test suites
python backend/tests/test_api.py
python backend/tests/test_vercel_routing.py

# Start FastAPI development server
npm run backend
# Or directly:
python main.py
```
FastAPI server will be running at `http://localhost:8000`  
Interactive Swagger documentation: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
# In a separate terminal tab:
npm run install:frontend

# Start Vite development server
npm run dev
```
Frontend interface will be available at `http://localhost:5173`. Vite automatically proxies `/api` requests to `http://localhost:8000`.

---

## Environment Variables

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Production | Supabase PostgreSQL URI (use port 6543 Transaction Pooler) | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require` |
| `ENVIRONMENT` | Optional | Deployment environment (`production` or `development`) | `production` |
| `VITE_API_URL` | Optional | Custom backend URL. On Vercel, leave empty to auto-route via `/api`. | `http://localhost:8000/api` |

> [!TIP]
> If `DATABASE_URL` is omitted locally, TicketlyCRM defaults to the bundled SQLite database at `backend/database/support_crm.db`. On Vercel previews without `DATABASE_URL`, it automatically utilizes an ephemeral copy in `/tmp` to prevent filesystem permission errors.

---

## Deployment Instructions for Vercel

TicketlyCRM is fully optimized for **Vercel** with zero complex setup.

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push your repository** to GitHub, GitLab, or Bitbucket.
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
3. **Import** the `ticket-crm` repository.
4. The project settings are automatically read from [`vercel.json`](vercel.json):
   - **Framework Preset**: Other / Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install --prefix frontend`
5. **Add Environment Variable**:
   - Key: `DATABASE_URL`
   - Value: Your Supabase PostgreSQL Connection String (Transaction Pooler port 6543)
6. Click **Deploy**. Vercel will build the frontend assets, configure `@vercel/python` for `api/index.py`, and assign a live production URL (e.g., `https://your-project.vercel.app`).

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Log in to your Vercel account
vercel login

# Deploy to preview
vercel

# Deploy to production with environment variables
vercel --prod
```

---

## Screenshots Section Placeholder

> *Screenshots will be added here showcasing the Dashboard, Ticket Creation, Real-Time Search, and Mobile Responsive Views.*

| Overview Dashboard | Ticket Details & Activity |
|:---:|:---:|
| *(Add Dashboard Screenshot)* | *(Add Ticket Details Screenshot)* |

| Create Ticket Form | Analytics & Reporting |
|:---:|:---:|
| *(Add Create Ticket Screenshot)* | *(Add Analytics Screenshot)* |

---

## Future Improvements

- [ ] **Role-Based Access Control (RBAC)**: Fine-grained permissions for Agents, Admins, and Team Leads.
- [ ] **Email Ingestion & Webhooks**: Automatic ticket generation from incoming customer support emails.
- [ ] **Real-time Collaboration**: WebSocket or Server-Sent Events (SSE) updates for ticket updates and agent typing indicators.
- [ ] **AI-Powered Response Suggestions**: Integration with Gemini API to propose automated resolution replies based on past tickets.
- [ ] **Customer Portal**: Dedicated self-service ticket status tracking portal for external customers.
