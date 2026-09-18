import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.attachment import Attachment
from app.services.ticket_service import get_ticket_by_id

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx"}
MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", Path(__file__).resolve().parents[2] / "static" / "uploads"))


async def add_attachment(db: Session, ticket_id: str, upload: UploadFile) -> Attachment:
    ticket = get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket '{ticket_id}' not found.")

    original_name = Path(upload.filename or "attachment").name
    extension = Path(original_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported attachment type. Use JPG, JPEG, PNG, PDF, DOC, or DOCX.")

    content = await upload.read(MAX_ATTACHMENT_BYTES + 1)
    if not content or len(content) > MAX_ATTACHMENT_BYTES:
        raise HTTPException(status_code=400, detail="Attachment must be between 1 byte and 10 MB.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{extension}"
    destination = UPLOAD_DIR / stored_name
    try:
        destination.write_bytes(content)
        attachment = Attachment(
            ticket_id=ticket.ticket_id,
            original_name=original_name,
            stored_name=stored_name,
            content_type=upload.content_type or "application/octet-stream",
            size_bytes=len(content),
        )
        db.add(attachment)
        db.commit()
        db.refresh(attachment)
        return attachment
    except Exception:
        db.rollback()
        if destination.exists():
            destination.unlink()
        raise
