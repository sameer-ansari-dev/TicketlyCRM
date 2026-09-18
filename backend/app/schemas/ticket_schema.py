from datetime import datetime
from typing import Dict, List, Literal, Optional, Union
from pydantic import BaseModel, EmailStr, Field
from app.schemas.note_schema import NoteResponse


TicketPriority = Literal["Low", "Medium", "High", "Critical"]
TicketStatus = Literal["Open", "In Progress", "Closed"]


class AttachmentResponse(BaseModel):
    id: int
    original_name: str
    content_type: str
    size_bytes: int
    url: str
    created_at: datetime

    class Config:
        from_attributes = True


class TicketBase(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=255, description="Full name of customer")
    customer_email: EmailStr = Field(..., description="Valid customer email address")
    subject: str = Field(..., min_length=3, max_length=255, description="Brief summary / title of support issue")
    description: str = Field(..., min_length=5, description="Full details of customer inquiry or bug report")
    priority: TicketPriority = Field("Medium", description="Triage priority level: Low, Medium, High, Critical")


class TicketCreate(TicketBase):
    pass


class TicketCreateResponse(BaseModel):
    ticket_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class TicketListItem(BaseModel):
    ticket_id: str
    customer_name: str
    customer_email: str
    subject: str
    description: Optional[str] = None
    status: str
    priority: TicketPriority = "Medium"
    created_at: datetime

    class Config:
        from_attributes = True


class TicketDetailResponse(BaseModel):
    ticket_id: str
    customer_name: str
    customer_email: str
    subject: str
    description: str
    status: TicketStatus
    priority: TicketPriority = "Medium"
    created_at: datetime
    updated_at: datetime
    notes: List[NoteResponse] = []
    attachments: List[AttachmentResponse] = []

    class Config:
        from_attributes = True


class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = Field(None, description="Updated ticket status: Open, In Progress, Closed")
    priority: Optional[TicketPriority] = Field(None, description="Updated priority: Low, Medium, High, Critical")
    notes: Optional[Union[str, List[str]]] = Field(None, description="Optional note text or list of notes to append")


class TicketUpdateResponse(BaseModel):
    success: bool
    updated_at: datetime


class StatsResponse(BaseModel):
    total: int
    open: int
    in_progress: int
    closed: int
    priorities: Dict[TicketPriority, int]
