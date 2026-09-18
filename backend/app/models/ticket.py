from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship

from app.database.database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticket_id = Column(String(32), unique=True, index=True, nullable=False)
    customer_name = Column(String(255), nullable=False, index=True)
    customer_email = Column(String(255), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Open", index=True, nullable=False)
    priority = Column(String(20), default="Medium", nullable=False, index=True)  # Low, Medium, High, Critical
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relational link to Notes
    notes = relationship(
        "Note",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="desc(Note.created_at)"
    )
    attachments = relationship(
        "Attachment",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="desc(Attachment.created_at)",
    )


class TicketSequence(Base):
    """A database-owned counter used to allocate human-readable ticket numbers."""

    __tablename__ = "ticket_sequences"

    sequence_key = Column(Integer, primary_key=True, default=1)
    next_value = Column(Integer, nullable=False, default=1001)


# Register the related mapper even when service/API modules are imported directly
# (for example, in unit tests) rather than through backend.main.
from app.models.attachment import Attachment  # noqa: E402,F401
