import sys
import os
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.database import SessionLocal
from app.schemas.ticket_schema import TicketCreate, TicketUpdate
from app.schemas.note_schema import NoteCreate
from app.services import ticket_service
from app.api.tickets import (
    create_ticket_endpoint,
    list_tickets_endpoint,
    get_ticket_details_endpoint,
    update_ticket_endpoint,
    add_ticket_note_endpoint,
    get_ticket_metrics_endpoint,
)


def run_tests():
    db = SessionLocal()
    try:
        print("1. Testing List Tickets & Initial Metrics...")
        stats = get_ticket_metrics_endpoint(db)
        print(f"   Initial Stats: Total={stats['total']}, Open={stats['open']}, InProgress={stats['in_progress']}, Closed={stats['closed']}")
        assert stats["total"] >= 1

        all_tickets = list_tickets_endpoint(status=None, search=None, db=db)
        print(f"   Fetched {len(all_tickets)} tickets.")
        assert len(all_tickets) >= 1

        print("2. Testing Status Filter...")
        filtered_tickets = list_tickets_endpoint(status="Closed", search=None, db=db)
        assert all(t.status == "Closed" for t in filtered_tickets)
        print(f"   Filtered {len(filtered_tickets)} Closed tickets.")

        print("3. Testing Multi-Field Search...")
        search_res = list_tickets_endpoint(status=None, search="Connor", db=db)
        if search_res:
            print("   Search matched successfully.")

        print("4. Testing Create Ticket Endpoint...")
        new_ticket = TicketCreate(
            customer_name="Barry Allen",
            customer_email="barry@starlabs.org",
            subject="Particle accelerator sensor latency",
            description="Tachyon sensor reporting high latency spikes during calibration.",
            priority="Urgent"
        )
        created = create_ticket_endpoint(new_ticket, db=db)
        print(f"   Created Ticket: {created.ticket_id} at {created.created_at}")
        assert created.ticket_id.startswith("TKT-")

        print("5. Testing Get Ticket Details...")
        detail = get_ticket_details_endpoint(created.ticket_id, db=db)
        assert detail.customer_name == "Barry Allen"
        print(f"   Retrieved ticket details successfully for {created.ticket_id}.")

        print("6. Testing Update Ticket Status via PUT...")
        update_payload = TicketUpdate(
            status="In Progress",
            notes="Assigned to engineering team."
        )
        res = update_ticket_endpoint(created.ticket_id, update_payload, db=db)
        assert res.success is True
        print("   Ticket updated successfully.")

        print("7. Testing Add Note Endpoint...")
        note_payload = NoteCreate(
            note_text="Diagnostics running in sandbox.",
            author="Cisco Ramon"
        )
        added_note = add_ticket_note_endpoint(created.ticket_id, note_payload, db=db)
        assert added_note.note_text == "Diagnostics running in sandbox."
        print(f"   Added note to {created.ticket_id}.")

        print("\nALL BACKEND API & SERVICE TESTS PASSED PERFECTLY!")
    finally:
        db.close()


if __name__ == "__main__":
    run_tests()
