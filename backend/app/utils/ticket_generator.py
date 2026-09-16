from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.ticket import Ticket


def generate_ticket_id(db: Session) -> str:
    """
    Generates collision-free, sequential human-readable Ticket IDs (e.g., TKT-1001, TKT-1002).
    """
    count = db.query(func.count(Ticket.id)).scalar() or 0
    candidate_number = 1001 + count

    while db.query(Ticket).filter(Ticket.ticket_id == f"TKT-{candidate_number}").first():
        candidate_number += 1

    return f"TKT-{candidate_number}"
