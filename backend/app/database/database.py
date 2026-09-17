import os
import urllib.parse
from dotenv import load_dotenv
from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables from backend/.env and root .env
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv(os.path.join(os.path.dirname(BASE_DIR), ".env"))

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

    # Fallback to local SQLite if no PostgreSQL URL is configured
    database_dir = os.path.join(BASE_DIR, "database")
    os.makedirs(database_dir, exist_ok=True)
    database_path = os.path.join(database_dir, "support_crm.db")
    return f"sqlite:///{database_path.replace(os.sep, '/')}"


DATABASE_URL = get_database_url()
IS_POSTGRES = DATABASE_URL.startswith("postgresql")
IS_SERVERLESS = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))

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

