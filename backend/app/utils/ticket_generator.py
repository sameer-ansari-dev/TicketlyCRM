from sqlalchemy.orm import Session
from sqlalchemy import update
from app.models.ticket import TicketSequence


def generate_ticket_id(db: Session) -> str:
    """
    Allocates a number by atomically advancing a database row. This is deliberately
    not based on ticket count or frontend state, so parallel requests cannot reuse it.
    """
    next_value = db.execute(
        update(TicketSequence)
        .where(TicketSequence.sequence_key == 1)
        .values(next_value=TicketSequence.next_value + 1)
        .returning(TicketSequence.next_value)
    ).scalar_one()
    return f"TKT-{next_value - 1}"
