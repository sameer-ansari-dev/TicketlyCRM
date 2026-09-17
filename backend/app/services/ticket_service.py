from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func

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
    search: Optional[str] = None
) -> List[Ticket]:
    query = db.query(Ticket)

    if status and status != "All":
        query = query.filter(Ticket.status == status)

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
    total = db.query(func.count(Ticket.id)).scalar() or 0
    open_count = db.query(func.count(Ticket.id)).filter(Ticket.status == "Open").scalar() or 0
    in_progress = db.query(func.count(Ticket.id)).filter(Ticket.status == "In Progress").scalar() or 0
    closed = db.query(func.count(Ticket.id)).filter(Ticket.status == "Closed").scalar() or 0

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress,
        "closed": closed,
    }
