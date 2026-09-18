from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import case, or_, desc, func

from app.models.ticket import Ticket
from app.models.note import Note
from app.schemas.ticket_schema import TicketCreate, TicketUpdate
from app.utils.ticket_generator import generate_ticket_id


def get_utc_now():
    return datetime.now(timezone.utc)


def create_ticket(db: Session, ticket_in: TicketCreate) -> Ticket:
    ticket_id = generate_ticket_id(db)
    now = get_utc_now()
    ticket = Ticket(
        ticket_id=ticket_id,
        customer_name=ticket_in.customer_name.strip(),
        customer_email=ticket_in.customer_email.strip().lower(),
        subject=ticket_in.subject.strip(),
        description=ticket_in.description.strip(),
        priority=ticket_in.priority or "Medium",
        status="Open",
        created_at=now,
        updated_at=now,
    )
    try:
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception:
        db.rollback()
        raise


def get_tickets(
    db: Session,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = "newest",
) -> List[Ticket]:
    query = db.query(Ticket)

    if status and status != "All":
        query = query.filter(Ticket.status == status)

    if priority:
        query = query.filter(Ticket.priority == priority)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Ticket.customer_name.ilike(term),
                Ticket.customer_email.ilike(term),
                Ticket.subject.ilike(term),
                Ticket.description.ilike(term),
                Ticket.ticket_id.ilike(term),
            )
        )

    if sort == "priority":
        priority_order = case(
            (Ticket.priority == "Critical", 4),
            (Ticket.priority == "High", 3),
            (Ticket.priority == "Medium", 2),
            (Ticket.priority == "Low", 1),
            else_=0,
        )
        return query.order_by(desc(priority_order), desc(Ticket.created_at)).all()

    return query.order_by(desc(Ticket.created_at)).all()


def get_ticket_by_id(db: Session, ticket_id: str) -> Optional[Ticket]:
    return db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()


def update_ticket(
    db: Session,
    ticket_id: str,
    payload: TicketUpdate
) -> Optional[datetime]:
    ticket = get_ticket_by_id(db, ticket_id)
    if not ticket:
        return None

    now = get_utc_now()
    if payload.status:
        ticket.status = payload.status
    if payload.priority:
        ticket.priority = payload.priority

    ticket.updated_at = now

    if payload.notes:
        if isinstance(payload.notes, str) and payload.notes.strip():
            note = Note(
                ticket_id=ticket.ticket_id,
                note_text=payload.notes.strip(),
                author="Support Agent",
                created_at=now,
            )
            db.add(note)
        elif isinstance(payload.notes, list):
            for item in payload.notes:
                if isinstance(item, str) and item.strip():
                    note = Note(
                        ticket_id=ticket.ticket_id,
                        note_text=item.strip(),
                        author="Support Agent",
                        created_at=now,
                    )
                    db.add(note)

    try:
        db.commit()
        db.refresh(ticket)
        return ticket.updated_at
    except Exception:
        db.rollback()
        raise


def add_note_to_ticket(
    db: Session,
    ticket_id: str,
    note_text: str,
    author: str = "Support Agent"
) -> Optional[Note]:
    ticket = get_ticket_by_id(db, ticket_id)
    if not ticket:
        return None

    now = get_utc_now()
    note = Note(
        ticket_id=ticket.ticket_id,
        note_text=note_text.strip(),
        author=author or "Support Agent",
        created_at=now,
    )
    ticket.updated_at = now
    try:
        db.add(note)
        db.commit()
        db.refresh(note)
        return note
    except Exception:
        db.rollback()
        raise


def get_ticket_stats(db: Session) -> dict:
    # One grouped query over the same normalized ticket columns used by the list API.
    status_counts = dict(db.query(Ticket.status, func.count(Ticket.id)).group_by(Ticket.status).all())
    priority_counts = dict(db.query(Ticket.priority, func.count(Ticket.id)).group_by(Ticket.priority).all())
    total = sum(status_counts.values())

    return {
        "total": total,
        "open": status_counts.get("Open", 0),
        "in_progress": status_counts.get("In Progress", 0),
        "closed": status_counts.get("Closed", 0),
        "priorities": {priority: priority_counts.get(priority, 0) for priority in ("Low", "Medium", "High", "Critical")},
    }
