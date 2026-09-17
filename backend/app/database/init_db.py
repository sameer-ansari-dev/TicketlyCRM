import os
import sys
from datetime import datetime, timezone

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database.database import engine, Base, SessionLocal
from app.models.ticket import Ticket
from app.models.note import Note

SAMPLE_TICKETS = [
    {
        "ticket_id": "TKT-1001",
        "customer_name": "Sarah Connor",
        "customer_email": "sarah.connor@cyberdyne.org",
        "subject": "Payment gateway timeout on checkout",
        "description": "Customer encountered a gateway timeout (HTTP 504) while attempting an annual subscription renewal via Visa card.",
        "status": "In Progress",
"priority": "Critical",
        "notes": [
            {"note_text": "Investigated Stripe webhooks. Timeout originated from upstream card processor.", "author": "Alex Dev"},
            {"note_text": "Customer contacted to confirm retry status.", "author": "Sarah Agent"}
        ]
    },
    {
        "ticket_id": "TKT-1002",
        "customer_name": "Bruce Wayne",
        "customer_email": "bruce@wayneenterprises.com",
        "subject": "Feature Request: Custom Webhook Signing Keys",
        "description": "Requesting ability to rotate and configure per-environment HMAC secrets for inbound webhooks.",
        "status": "Open",
        "priority": "Medium",
        "notes": [
            {"note_text": "Forwarded to Product team for consideration in Q4 roadmap.", "author": "Triage Bot"}
        ]
    },
    {
        "ticket_id": "TKT-1003",
        "customer_name": "Tony Stark",
        "customer_email": "tony@starkindustries.io",
        "subject": "API Rate limit exceeded during batch export",
        "description": "Automated ETL script hit 429 Too Many Requests while pulling ticket historical metrics at midnight.",
        "status": "Closed",
        "priority": "High",
        "notes": [
            {"note_text": "Increased enterprise tier threshold to 500 req/min for organization.", "author": "DevOps Engineer"},
            {"note_text": "Confirmed ETL script succeeded without further errors.", "author": "Tony Agent"}
        ]
    },
    {
        "ticket_id": "TKT-1004",
        "customer_name": "Elena Rostova",
        "customer_email": "elena.rostova@nexusgroup.com",
        "subject": "SSO Login redirects to error page",
        "description": "Okta SAML assertion is missing the email claim attribute after recent IdP cert rotation.",
        "status": "In Progress",
"priority": "Critical",
        "notes": [
            {"note_text": "Inspected SAML metadata XML; updated ACS URL and cert fingerprint.", "author": "Security Lead"}
        ]
    },
    {
        "ticket_id": "TKT-1005",
        "customer_name": "Marcus Vance",
        "customer_email": "marcus.v@cloudscale.net",
        "subject": "Missing invoices in billing dashboard",
        "description": "Invoices for July and August are missing from the billing history tab in workspace settings.",
        "status": "Closed",
        "priority": "Low",
        "notes": [
            {"note_text": "Regenerated PDF invoices and sent copy via email to accounts payable.", "author": "Billing Specialist"}
        ]
    }
]


def init_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing_count = db.query(Ticket).count()
        if existing_count == 0:
            print("Seeding database with sample tickets...")
            now = datetime.now(timezone.utc)
            for t_data in SAMPLE_TICKETS:
                item = dict(t_data)
                notes_data = item.pop("notes", [])
                ticket = Ticket(**item, created_at=now, updated_at=now)
                db.add(ticket)
                db.flush()

                for n in notes_data:
                    note = Note(
                        ticket_id=ticket.ticket_id,
                        note_text=n["note_text"],
                        author=n["author"],
                        created_at=now,
                    )
                    db.add(note)

            db.commit()
            print(f"Successfully seeded {len(SAMPLE_TICKETS)} tickets.")
        else:
            print(f"Database already contains {existing_count} tickets.")
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
