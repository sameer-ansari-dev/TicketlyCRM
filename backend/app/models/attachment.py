from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(String(32), ForeignKey("tickets.ticket_id", ondelete="CASCADE"), nullable=False, index=True)
    original_name = Column(String(255), nullable=False)
    stored_name = Column(String(255), nullable=False, unique=True)
    content_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)

    ticket = relationship("Ticket", back_populates="attachments")

    @property
    def url(self):
        return f"/uploads/{self.stored_name}"
