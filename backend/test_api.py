import sys
import os
from database import SessionLocal
from schemas import TicketCreate, TicketUpdate, NoteCreate
from main import (
    create_ticket,
    list_tickets,
    get_ticket,
    update_ticket,
    add_note,
    get_stats,
)


def run_tests():
    db = SessionLocal()
    try:
        print("1. Testing List Tickets & Initial Metrics...")
        stats = get_stats(db)
        print(f"   Initial Stats: Total={stats.total}, Open={stats.open}, InProgress={stats.in_progress}, Closed={stats.closed}")
        assert stats.total >= 5

        all_tickets = list_tickets(status=None, search=None, db=db)
        print(f"   Fetched {len(all_tickets)} tickets.")
        assert len(all_tickets) >= 5

        print("2. Testing Status Filter...")
        in_progress = list_tickets(status="In Progress", search=None, db=db)
        assert all(t.status == "In Progress" for t in in_progress)
        print(f"   Filtered {len(in_progress)} In Progress tickets.")

        print("3. Testing Multi-Field Search...")
        results = list_tickets(status=None, search="Sophia", db=db)
        assert len(results) >= 1
        assert any("Sophia" in t.customer_name for t in results)
        print("   Search by customer name matched successfully.")

        print("4. Testing Create Ticket Endpoint...")
        new_ticket_payload = TicketCreate(
            customer_name="Diana Prince",
            customer_email="diana@themyscira.gov",
            subject="Security gateway encryption protocol update",
            description="Requesting TLS 1.3 requirement for inbound webhook callbacks.",
            priority="Urgent"
        )
        created = create_ticket(new_ticket_payload, db=db)
        print(f"   Created Ticket: {created.ticket_id} at {created.created_at}")
        assert created.ticket_id.startswith("TKT-")

        print("5. Testing Get Ticket Details...")
        ticket_detail = get_ticket(created.ticket_id, db=db)
        assert ticket_detail.customer_name == "Diana Prince"
        print(f"   Retrieved ticket details for {created.ticket_id}")

        print("6. Testing Update Ticket Status & Appending Notes...")
        update_payload = TicketUpdate(
            status="In Progress",
            notes="Assigned to infrastructure team for validation."
        )
        res = update_ticket(created.ticket_id, update_payload, db=db)
        assert res.success is True

        # Verify update
        refreshed = get_ticket(created.ticket_id, db=db)
        assert refreshed.status == "In Progress"
        assert len(refreshed.notes) >= 1
        assert any("infrastructure team" in n.note_text for n in refreshed.notes)
        print("   Successfully updated status and appended note via PUT.")

        print("7. Testing Add Note Endpoint...")
        note_payload = NoteCreate(
            note_text="Customer requested follow-up within 4 hours.",
            author="Support Lead"
        )
        added_note = add_note(created.ticket_id, note_payload, db=db)
        assert added_note.note_text == "Customer requested follow-up within 4 hours."
        print(f"   Added note with ID {added_note.id} to {created.ticket_id}")

        print("\nALL SIMPLIFIED BACKEND API TESTS PASSED SUCCESSFULLY!")
    finally:
        db.close()


if __name__ == "__main__":
    run_tests()
