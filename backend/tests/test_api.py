import sys
import os
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.database import SessionLocal
from app.schemas.ticket_schema import TicketCreate, TicketUpdate, TicketResponse
from app.schemas.note_schema import NoteCreate
from app.services import ticket_service
from app.api.tickets import (
    create_ticket_endpoint,
    list_tickets_endpoint,
    get_ticket_details_endpoint,
    update_ticket_endpoint,
    add_ticket_note_endpoint,
    delete_ticket_endpoint,
    get_ticket_metrics_endpoint,
)
from fastapi import HTTPException


def run_tests():
    db = SessionLocal()
    try:
        print("1. Testing List Tickets & Initial Metrics...")
        stats = get_ticket_metrics_endpoint(db)
        print(f"   Initial Stats: Total={stats['total']}, Open={stats['open']}, InProgress={stats['in_progress']}, Closed={stats['closed']}")
        assert stats["total"] >= 1

        all_tickets = list_tickets_endpoint(
            status=None, priority=None, search=None, sort="newest", db=db
        )
        print(f"   Fetched {len(all_tickets)} tickets.")
        assert len(all_tickets) >= 1

        print("2. Testing Status Filter...")
        filtered_tickets = list_tickets_endpoint(
            status="Closed", priority=None, search=None, sort="newest", db=db
        )
        assert all(t.status == "Closed" for t in filtered_tickets)
        print(f"   Filtered {len(filtered_tickets)} Closed tickets.")

        print("3. Testing Multi-Field Search...")
        search_res = list_tickets_endpoint(
            status=None, priority=None, search="Fernandes", sort="newest", db=db
        )
        print("   Search query executed successfully.")

        print("4. Testing Create Ticket with Example Expected Payload...")
        example_payload = TicketCreate(
            customer_name="John Fernandes",
            customer_email="john.fernandes@gmail.com",
            subject="Unable to Login",
            description="Customer cannot login after password reset",
            priority="High",
            status="Open"
        )
        created_example = create_ticket_endpoint(example_payload, db=db)
        print(f"   Created Ticket with Example Payload: {created_example.ticket_id}")
        assert created_example.ticket_id.startswith("TKT-")

        print("5. Testing Priority & Status Normalization (lowercase + legacy Urgent)...")
        normalized_payload = TicketCreate(
            customer_name="Jane Doe",
            customer_email="jane.doe@example.com",
            subject="Billing discrepancy issue",
            description="Detailed description for billing ticket",
            priority="urgent",  # Should map to 'Critical'
            status="open"       # Should map to 'Open'
        )
        assert normalized_payload.priority == "Critical"
        assert normalized_payload.status == "Open"
        created_normalized = create_ticket_endpoint(normalized_payload, db=db)
        print(f"   Created Normalized Ticket: {created_normalized.ticket_id} with priority={normalized_payload.priority}")

        print("6. Testing TicketResponse Model Verification...")
        assert TicketResponse is not None
        detail = get_ticket_details_endpoint(created_example.ticket_id, db=db)
        assert detail.customer_name == "John Fernandes"
        assert detail.status == "Open"
        assert detail.priority == "High"
        print(f"   Retrieved ticket details successfully for {created_example.ticket_id}.")

        print("7. Testing Update Ticket Status via PUT...")
        update_payload = TicketUpdate(
            status="In Progress",
            notes="Assigned to senior engineering team."
        )
        res = update_ticket_endpoint(created_example.ticket_id, update_payload, db=db)
        assert res.success is True
        detail_updated = get_ticket_details_endpoint(created_example.ticket_id, db=db)
        assert detail_updated.status == "In Progress"
        print("   Ticket updated successfully to In Progress.")

        print("8. Testing Add Note Endpoint...")
        note_payload = NoteCreate(
            note_text="Diagnostics running in sandbox environment.",
            author="Support Agent"
        )
        added_note = add_ticket_note_endpoint(created_example.ticket_id, note_payload, db=db)
        assert added_note.note_text == "Diagnostics running in sandbox environment."
        print(f"   Added note to {created_example.ticket_id}.")

        print("9. Testing Delete Ticket Endpoint...")
        del_res = delete_ticket_endpoint(created_normalized.ticket_id, db=db)
        assert del_res["success"] is True
        print(f"   Deleted Ticket {created_normalized.ticket_id} successfully.")

        try:
            get_ticket_details_endpoint(created_normalized.ticket_id, db=db)
            assert False, "Expected 404 for deleted ticket"
        except HTTPException as exc:
            assert exc.status_code == 404
            print(f"   Verified 404 for deleted Ticket {created_normalized.ticket_id}.")

        print("10. Testing Dashboard Statistics...")
        updated_stats = get_ticket_metrics_endpoint(db)
        print(f"   Updated Stats: Total={updated_stats['total']}, Open={updated_stats['open']}, InProgress={updated_stats['in_progress']}, Closed={updated_stats['closed']}")
        assert updated_stats["total"] >= 1
        assert "priorities" in updated_stats

        print("\nALL BACKEND API & SERVICE TESTS PASSED PERFECTLY!")
    finally:
        db.close()


if __name__ == "__main__":
    run_tests()
