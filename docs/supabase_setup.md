# TicketlyCRM - Supabase PostgreSQL & Vercel Setup Guide

This guide provides step-by-step instructions for provisioning Supabase PostgreSQL, migrating existing data from SQLite, and deploying TicketlyCRM to Vercel.

---

## Architecture Overview

- **Frontend**: React 18 + TailwindCSS + Vite (hosted on Vercel Edge CDN).
- **Backend API**: FastAPI (Python 3.10+) running as Vercel Serverless Functions via `/api/index.py`.
- **Database**: Supabase PostgreSQL 15+ with serverless connection pooling.
- **ORM**: SQLAlchemy 2.0 with PostgreSQL native driver (`psycopg2-binary`).

```
┌────────────────────────────────────────────────────────┐
│                        VERCEL                          │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │  Vite React Frontend  │──▶│  FastAPI Serverless  │  │
│  │   (Static CDN Edge)   │   │   (api/index.py)     │  │
│  └───────────────────────┘   └──────────┬───────────┘  │
└─────────────────────────────────────────┼──────────────┘
                                          │
                            SSL (Port 6543 Pooler)
                                          ▼
                      ┌──────────────────────────────────────┐
                      │        SUPABASE POSTGRESQL           │
                      │  - tickets table                     │
                      │  - notes table (cascade foreign key) │
                      │  - performance indexes               │
                      └──────────────────────────────────────┘
```

---

## Step 1: Create a Supabase Project

1. Log into [Supabase](https://supabase.com) and click **"New Project"**.
2. Select your organization, choose an app name (e.g., `ticketly-crm`), set a database password, and pick the region closest to your Vercel deployment (e.g., `US East (N. Virginia)`).
3. Wait ~1-2 minutes for Supabase to finish provisioning your PostgreSQL database.

---

## Step 2: Retrieve Your PostgreSQL Connection String

Because Vercel runs Python backend code in **serverless functions** (ephemeral containers), you should use Supabase's **Transaction Pooler** (Supavisor on port `6543`). This prevents connection exhaustion when multiple requests arrive concurrently.

1. In your Supabase project dashboard, navigate to:
   **Project Settings** (gear icon) ➔ **Database** ➔ **Connection Pooling**.
2. Under **Connection string**, select:
   - **Type**: `URI`
   - **Mode**: `Transaction` (port `6543`)
3. The URI looks like:
   ```
   postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
   ```
4. Replace `[YOUR-PASSWORD]` with your real database password.
   *(Note: If your password contains special characters like `@`, `#`, or `%`, make sure to URL-encode them, e.g., `@` becomes `%40`).*

---

## Step 3: Run the Schema in Supabase

You can either let FastAPI auto-generate the tables on first startup, or execute the official SQL schema script:

1. Open **SQL Editor** in your Supabase dashboard.
2. Click **New Query**.
3. Copy the contents of [`schema/supabase_schema.sql`](file:///d:/ticket-crm/schema/supabase_schema.sql) and paste it into the editor.
4. Click **Run**.
5. Verify that `tickets` and `notes` tables have been created with indexes by navigating to the **Table Editor**.

---

## Step 4: Migrate Existing SQLite Data (Optional)

If you have existing customer tickets in your local SQLite database and want to preserve them:

1. In your local terminal, set your `DATABASE_URL`:
   ```powershell
   # Windows PowerShell
   $env:DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"
   ```
2. Run the migration script in dry-run mode to verify the records:
   ```bash
   python backend/app/database/migrate_to_supabase.py --dry-run
   ```
3. Execute the actual migration:
   ```bash
   python backend/app/database/migrate_to_supabase.py -y
   ```
4. All tickets, notes, timestamps, and customer records will be safely inserted into Supabase without duplicate key errors.

---

## Step 5: Configure Vercel Deployment

TicketlyCRM is configured for full-stack monorepo deployment on Vercel out of the box with `vercel.json` and `api/index.py`.

### 1. Push Code to Git
Push your project repository to GitHub, GitLab, or Bitbucket.

### 2. Import Project in Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and import your `TicketlyCRM` repository.
2. In the **Project Configuration** screen:
   - **Framework Preset**: `Vite` or `Other`
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm --prefix frontend run build` (configured in `vercel.json`)
   - **Output Directory**: `frontend/dist` (configured in `vercel.json`)

### 3. Add Environment Variables in Vercel
Expand **Environment Variables** and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@[HOST]:6543/postgres?sslmode=require` | Supabase Transaction Pooler URI |
| `ENVIRONMENT` | `production` | Enables production optimizations |

Click **Deploy**.

---

## Step 6: Verify Live Deployment

Once Vercel finishes deploying:

1. **Test API Health**:
   Visit `https://<your-project>.vercel.app/api/health` in your browser.
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "TicketlyCRM Backend",
     "version": "1.0.0",
     "database": {
       "connected": true,
       "dialect": "postgresql",
       "target": "aws-0-us-east-1.pooler.supabase.com:6543",
       "pool_type": "NullPool",
       "tables": ["notes", "tickets"]
     }
   }
   ```

2. **Test Frontend App**:
   Visit `https://<your-project>.vercel.app/` and test:
   - Creating a new ticket.
   - Searching tickets.
   - Updating ticket status.
   - Adding internal agent notes.

---

## Local Development Workflow

To run TicketlyCRM locally with Supabase or SQLite:

### With Supabase:
Create a `.env` file in `backend/.env`:
```env
DATABASE_URL=postgresql://postgres.[REF]:[PASS]@[HOST]:6543/postgres?sslmode=require
```

### With Local SQLite (Offline Mode):
Leave `backend/.env` without `DATABASE_URL`. TicketlyCRM will automatically fall back to `backend/database/support_crm.db`.

### Start Backend:
```bash
cd backend
python main.py
```
Backend runs on `http://localhost:8000`.

### Start Frontend:
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`.
