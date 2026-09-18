from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.ticket_schema import (
    TicketCreate,
    TicketCreateResponse,
    TicketListItem,
    TicketDetailResponse,
    TicketUpdate,
    TicketUpdateResponse,
    StatsResponse, AttachmentResponse
)
from app.schemas.note_schema import NoteCreate, NoteResponse
from app.services import ticket_service
from app.services import attachment_service

router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)


@router.post(
    "",
    response_model=TicketCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new support ticket"
)
@router.post(
    "/",
    response_model=TicketCreateResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False
)
def create_ticket_endpoint(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db)
):
    ticket = ticket_service.create_ticket(db, ticket_in)
    return TicketCreateResponse(
        ticket_id=ticket.ticket_id,
        created_at=ticket.created_at
    )


@router.get(
    "",
    response_model=List[TicketListItem],
    summary="List tickets with optional status and multi-field search filter"
)
@router.get(
    "/",
    response_model=List[TicketListItem],
    include_in_schema=False
)
def list_tickets_endpoint(
    status: Optional[str] = Query(None, description="Filter by status: Open, In Progress, Closed"),
    priority: Optional[str] = Query(None, description="Filter by priority: Low, Medium, High, Critical"),
    search: Optional[str] = Query(None, description="Search term across name, email, subject, description, ticket ID"),
    sort: str = Query("newest", pattern="^(newest|priority)$", description="Sort by newest or priority"),
    db: Session = Depends(get_db)
):
    return ticket_service.get_tickets(db, status=status, priority=priority, search=search, sort=sort)


@router.get(
    "/stats/summary",
    response_model=StatsResponse,
    summary="Get aggregated ticket metrics (Total, Open, In Progress, Closed)"
)
def get_ticket_metrics_endpoint(
    db: Session = Depends(get_db)
):
    return ticket_service.get_ticket_stats(db)


@router.get(
    "/{ticket_id}",
    response_model=TicketDetailResponse,
    summary="Get detailed view of a specific ticket including notes"
)
def get_ticket_details_endpoint(
    ticket_id: str,
    db: Session = Depends(get_db)
):
    ticket = ticket_service.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_id}' not found."
        )
    return ticket


@router.put(
    "/{ticket_id}",
    response_model=TicketUpdateResponse,
    summary="Update ticket status and optionally append a note"
)
def update_ticket_endpoint(
    ticket_id: str,
    payload: TicketUpdate,
    db: Session = Depends(get_db)
):
    updated_at = ticket_service.update_ticket(db, ticket_id, payload)
    if not updated_at:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_id}' not found."
        )

    return TicketUpdateResponse(
        success=True,
        updated_at=updated_at
    )


@router.post(
    "/{ticket_id}/notes",
    response_model=NoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a note/comment to a specific ticket"
)
def add_ticket_note_endpoint(
    ticket_id: str,
    payload: NoteCreate,
    db: Session = Depends(get_db)
):
    note = ticket_service.add_note_to_ticket(
        db,
        ticket_id=ticket_id,
        note_text=payload.note_text,
        author=payload.author or "Support Agent"
    )
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_id}' not found."
        )
    return note


@router.post(
    "/{ticket_id}/attachments",
    response_model=AttachmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a ticket attachment (JPG, PNG, PDF, DOC, or DOCX; max 10 MB)",
)
async def upload_ticket_attachment_endpoint(
    ticket_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await attachment_service.add_attachment(db, ticket_id, file)
