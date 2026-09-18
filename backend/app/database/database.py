import os
import urllib.parse
from dotenv import load_dotenv
from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables from backend/.env and root .env
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv(os.path.join(os.path.dirname(BASE_DIR), ".env"))

IS_SERVERLESS = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))

def get_database_url() -> str:
    """
    Constructs and normalizes the database URL for Supabase PostgreSQL or SQLite fallback.
    """
    db_url = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DATABASE_URL")

    # If discrete Supabase credentials are provided
    if not db_url and os.getenv("SUPABASE_DB_HOST") and os.getenv("SUPABASE_DB_PASSWORD"):
        host = os.getenv("SUPABASE_DB_HOST")
        port = os.getenv("SUPABASE_DB_PORT", "5432")
        user = os.getenv("SUPABASE_DB_USER", "postgres")
        raw_password = os.getenv("SUPABASE_DB_PASSWORD", "")
        password = urllib.parse.quote_plus(raw_password)
        dbname = os.getenv("SUPABASE_DB_NAME", "postgres")
        db_url = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"

    if db_url:
        # Normalize postgres:// to postgresql:// for SQLAlchemy 2.0
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        return db_url

    # Fallback to SQLite if no PostgreSQL URL is configured
    database_dir = os.path.join(BASE_DIR, "database")

    if IS_SERVERLESS:
        # In Vercel serverless functions, /var/task is read-only.
        # Copy the pre-seeded SQLite database to system temp directory so writes succeed.
        import tempfile
        tmp_dir = tempfile.gettempdir()
        os.makedirs(tmp_dir, exist_ok=True)
        tmp_db = os.path.join(tmp_dir, "support_crm.db")
        if not os.path.exists(tmp_db):
            seed_db = os.path.join(database_dir, "support_crm.db")
            if os.path.isfile(seed_db):
                try:
                    import shutil
                    shutil.copy2(seed_db, tmp_db)
                except Exception:
                    pass
        return f"sqlite:///{tmp_db.replace(os.sep, '/')}"

    os.makedirs(database_dir, exist_ok=True)
    database_path = os.path.join(database_dir, "support_crm.db")
    return f"sqlite:///{database_path.replace(os.sep, '/')}"


DATABASE_URL = get_database_url()
IS_POSTGRES = DATABASE_URL.startswith("postgresql")

# Engine Configuration
connect_args = {}
engine_kwargs = {}

if IS_POSTGRES:
    # Supabase PostgreSQL requires SSL
    if "sslmode" not in DATABASE_URL:
        connect_args["sslmode"] = "require"

    if IS_SERVERLESS:
        # On Vercel serverless functions, avoid holding persistent pool across freezes
        from sqlalchemy.pool import NullPool
        engine_kwargs["poolclass"] = NullPool
    else:
        # Standard server / local development pool
        engine_kwargs["pool_pre_ping"] = True
        engine_kwargs["pool_size"] = 10
        engine_kwargs["max_overflow"] = 20
        engine_kwargs["pool_recycle"] = 1800  # 30 mins
else:
    # SQLite configuration
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
)

# Apply SQLite foreign key pragma only if SQLite
if not IS_POSTGRES:
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency yielding a transactional database session.
    Automatically rolls back on uncaught exceptions and closes the session.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_masked_db_url() -> str:
    """Returns safe database URL with password hidden for logging and health checks."""
    try:
        parsed = urllib.parse.urlsplit(DATABASE_URL)
        if parsed.password:
            netloc = f"{parsed.username}:***@{parsed.hostname}"
            if parsed.port:
                netloc += f":{parsed.port}"
            return urllib.parse.urlunsplit((parsed.scheme, netloc, parsed.path, parsed.query, parsed.fragment))
        return DATABASE_URL
    except Exception:
        return "configured"


def test_connection():
    """Diagnostic function to test database connectivity."""
    try:
        with engine.connect() as conn:
            res = conn.execute(text("SELECT 1")).scalar()
            return {
                "connected": res == 1,
                "engine": "PostgreSQL (Supabase)" if IS_POSTGRES else "SQLite",
                "is_serverless": IS_SERVERLESS,
                "url": get_masked_db_url()
            }
    except Exception as exc:
        return {
            "connected": False,
            "engine": "PostgreSQL (Supabase)" if IS_POSTGRES else "SQLite",
            "error": str(exc),
            "url": get_masked_db_url()
        }


def ensure_ticket_priority_schema():
    """Apply backwards-compatible data integrity migrations on startup."""
    inspector = inspect(engine)
    if "tickets" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("tickets")}
    with engine.begin() as connection:
        if "priority" not in columns:
            connection.execute(text("ALTER TABLE tickets ADD COLUMN priority VARCHAR(20) NOT NULL DEFAULT 'Medium'"))
        # The original UI used Urgent. Preserve its meaning under the new Critical label.
        connection.execute(text("UPDATE tickets SET priority = 'Critical' WHERE priority = 'Urgent'"))
        # Historic imports used inconsistent casing and whitespace. Canonical values keep
        # list filters and summary statistics on the same dataset.
        connection.execute(text("""
            UPDATE tickets
            SET status = CASE lower(trim(status))
                WHEN 'open' THEN 'Open'
                WHEN 'in progress' THEN 'In Progress'
                WHEN 'closed' THEN 'Closed'
                ELSE status
            END
        """))


def ensure_ticket_sequence():
    """Seed the database sequence above every existing TKT-nnnn record exactly once."""
    inspector = inspect(engine)
    if "tickets" not in inspector.get_table_names() or "ticket_sequences" not in inspector.get_table_names():
        return

    with engine.begin() as connection:
        if IS_POSTGRES:
            max_number = connection.execute(text("""
                SELECT COALESCE(MAX(CASE WHEN ticket_id ~ '^TKT-[0-9]+$'
                    THEN CAST(substring(ticket_id FROM 5) AS INTEGER) END), 1000)
                FROM tickets
            """)).scalar() or 1000
            connection.execute(text("""
                INSERT INTO ticket_sequences (sequence_key, next_value)
                VALUES (1, :next_value)
                ON CONFLICT (sequence_key) DO NOTHING
            """), {"next_value": int(max_number) + 1})
        else:
            rows = connection.execute(text("SELECT ticket_id FROM tickets WHERE ticket_id LIKE 'TKT-%'"))
            values = [int(row[0][4:]) for row in rows if row[0][4:].isdigit()]
            connection.execute(text("INSERT OR IGNORE INTO ticket_sequences (sequence_key, next_value) VALUES (1, :next_value)"), {"next_value": (max(values) if values else 1000) + 1})
