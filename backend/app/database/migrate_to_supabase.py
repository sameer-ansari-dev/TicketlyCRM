"""
SQLite to Supabase PostgreSQL Data Migration Script
===================================================
Migrates all existing tickets and internal notes from local SQLite database
to Supabase PostgreSQL while preserving timestamps, IDs, and relations.

Usage:
    python backend/app/database/migrate_to_supabase.py [--sqlite-path <path>] [--dry-run]
"""

import os
import sys
import argparse
import sqlite3
from datetime import datetime, timezone

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database.database import engine, Base, SessionLocal, get_masked_db_url
from app.models.ticket import Ticket
from app.models.note import Note


def find_sqlite_db(override_path: str = None) -> str:
    """Locates the existing SQLite database file."""
    if override_path and os.path.isfile(override_path):
        return override_path

    candidates = [
        os.path.join(backend_dir, "database", "support_crm.db"),
        os.path.join(backend_dir, "support_crm.db"),
        os.path.join(os.path.dirname(backend_dir), "support_crm.db"),
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None


def parse_datetime(val):
    """Safely converts string or datetime object to python datetime with UTC timezone."""
    if not val:
        return datetime.now(timezone.utc)
    if isinstance(val, datetime):
        if val.tzinfo is None:
            return val.replace(tzinfo=timezone.utc)
        return val
    try:
        dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return datetime.now(timezone.utc)


def run_migration(sqlite_path: str = None, dry_run: bool = False, auto_confirm: bool = False):
    print("=" * 70)
    print("TicketlyCRM: SQLite -> Supabase PostgreSQL Data Migration")
    print("=" * 70)

    target_masked_url = get_masked_db_url()
    print(f"Target Database: {target_masked_url}")
    if "sqlite" in target_masked_url.lower():
        print("[WARNING] Target database appears to be SQLite, not PostgreSQL/Supabase.")
        print("          Set DATABASE_URL in your .env or environment to point to Supabase.")
        if not auto_confirm:
            confirm = input("Continue anyway? (y/N): ").strip().lower()
            if confirm != "y":
                print("Aborted by user.")
                return

    db_path = find_sqlite_db(sqlite_path)
    if not db_path:
        print(f"[ERROR] Could not find SQLite source database.")
        print(f"        Checked locations in: {backend_dir}")
        sys.exit(1)

    print(f"Source SQLite DB: {db_path} ({os.path.getsize(db_path)} bytes)")

    # Read from SQLite
    src_conn = sqlite3.connect(db_path)
    src_conn.row_factory = sqlite3.Row
    src_cur = src_conn.cursor()

    try:
        src_cur.execute("SELECT * FROM tickets ORDER BY id ASC")
        sqlite_tickets = src_cur.fetchall()
        print(f"Found {len(sqlite_tickets)} tickets in SQLite.")
    except Exception as exc:
        print(f"[ERROR] Failed reading tickets from SQLite: {exc}")
        sqlite_tickets = []

    try:
        src_cur.execute("SELECT * FROM notes ORDER BY id ASC")
        sqlite_notes = src_cur.fetchall()
        print(f"Found {len(sqlite_notes)} notes in SQLite.")
    except Exception as exc:
        print(f"[WARNING] Failed reading notes from SQLite: {exc}")
        sqlite_notes = []

    src_conn.close()

    if not sqlite_tickets:
        print("No tickets found to migrate. Exiting.")
        return

    if dry_run:
        print(f"\n[DRY RUN] Would migrate {len(sqlite_tickets)} tickets and {len(sqlite_notes)} notes.")
        print("[DRY RUN] Complete. No database writes were performed.")
        return

    # Ensure tables exist in target database
    print("\nEnsuring tables exist in target database...")
    Base.metadata.create_all(bind=engine)

    # Insert into target DB
    target_db = SessionLocal()
    migrated_tickets = 0
    skipped_tickets = 0
    migrated_notes = 0
    skipped_notes = 0

    try:
        print("\nMigrating tickets...")
        for row in sqlite_tickets:
            row_dict = dict(row)
            t_id = row_dict.get("ticket_id")

            # Check if already exists
            existing = target_db.query(Ticket).filter(Ticket.ticket_id == t_id).first()
            if existing:
                skipped_tickets += 1
                continue

            created_at = parse_datetime(row_dict.get("created_at"))
            updated_at = parse_datetime(row_dict.get("updated_at") or row_dict.get("created_at"))

            new_ticket = Ticket(
                ticket_id=t_id,
                customer_name=row_dict.get("customer_name") or "Unknown",
                customer_email=row_dict.get("customer_email") or "unknown@example.com",
                subject=row_dict.get("subject") or "No Subject",
                description=row_dict.get("description") or "",
                status=row_dict.get("status") or "Open",
                priority=row_dict.get("priority") or "Medium",
                created_at=created_at,
                updated_at=updated_at,
            )
            target_db.add(new_ticket)
            migrated_tickets += 1

        target_db.commit()
        print(f"Tickets complete: {migrated_tickets} migrated, {skipped_tickets} already existed.")

        print("\nMigrating notes...")
        for row in sqlite_notes:
            row_dict = dict(row)
            t_id = row_dict.get("ticket_id")
            text = row_dict.get("note_text") or ""
            author = row_dict.get("author") or "Support Agent"
            created_at = parse_datetime(row_dict.get("created_at"))

            # Verify parent ticket exists in target
            parent = target_db.query(Ticket).filter(Ticket.ticket_id == t_id).first()
            if not parent:
                skipped_notes += 1
                continue

            # Check for duplicate note
            dup = target_db.query(Note).filter(
                Note.ticket_id == t_id,
                Note.note_text == text
            ).first()
            if dup:
                skipped_notes += 1
                continue

            new_note = Note(
                ticket_id=t_id,
                note_text=text,
                author=author,
                created_at=created_at,
            )
            target_db.add(new_note)
            migrated_notes += 1

        target_db.commit()
        print(f"Notes complete: {migrated_notes} migrated, {skipped_notes} skipped/existed.")

        print("\n" + "=" * 70)
        print("MIGRATION FINISHED SUCCESSFULLY!")
        print(f"Total Tickets in Target: {target_db.query(Ticket).count()}")
        print(f"Total Notes in Target:   {target_db.query(Note).count()}")
        print("=" * 70)

    except Exception as exc:
        target_db.rollback()
        print(f"\n[ERROR] Migration failed with error: {exc}")
        raise
    finally:
        target_db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate SQLite data to Supabase PostgreSQL")
    parser.add_argument("--sqlite-path", help="Path to source SQLite database file", default=None)
    parser.add_argument("--dry-run", action="store_true", help="Inspect and simulate migration without writing")
    parser.add_argument("-y", "--yes", action="store_true", help="Automatically confirm without interactive prompt")
    args = parser.parse_args()

    run_migration(sqlite_path=args.sqlite_path, dry_run=args.dry_run, auto_confirm=args.yes)
