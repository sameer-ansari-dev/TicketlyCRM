from datetime import datetime
from typing import Dict, List, Literal, Optional, Union
from pydantic import BaseModel, EmailStr, Field, field_validator
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
    status: Optional[TicketStatus] = Field("Open", description="Ticket status: Open, In Progress, Closed")

    @field_validator("customer_name", "subject", "description", mode="before")
    @classmethod
    def strip_whitespace(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("customer_email", mode="before")
    @classmethod
    def normalize_email(cls, v):
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_priority(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return "Medium"
        if isinstance(v, str):
            clean = v.strip().lower()
            if clean == "urgent":
                return "Critical"
            mapping = {"low": "Low", "medium": "Medium", "high": "High", "critical": "Critical"}
            if clean in mapping:
                return mapping[clean]
        return v

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return "Open"
        if isinstance(v, str):
            clean = v.strip().lower()
            mapping = {
                "open": "Open",
                "in progress": "In Progress",
                "in_progress": "In Progress",
                "inprogress": "In Progress",
                "closed": "Closed",
            }
            if clean in mapping:
                return mapping[clean]
        return v


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


# Standard schema inspection alias
TicketResponse = TicketDetailResponse


class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = Field(None, description="Updated ticket status: Open, In Progress, Closed")
    priority: Optional[TicketPriority] = Field(None, description="Updated priority: Low, Medium, High, Critical")
    notes: Optional[Union[str, List[str]]] = Field(None, description="Optional note text or list of notes to append")

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_update_priority(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        if isinstance(v, str):
            clean = v.strip().lower()
            if clean == "urgent":
                return "Critical"
            mapping = {"low": "Low", "medium": "Medium", "high": "High", "critical": "Critical"}
            if clean in mapping:
                return mapping[clean]
        return v

    @field_validator("status", mode="before")
    @classmethod
    def normalize_update_status(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        if isinstance(v, str):
            clean = v.strip().lower()
            mapping = {
                "open": "Open",
                "in progress": "In Progress",
                "in_progress": "In Progress",
                "inprogress": "In Progress",
                "closed": "Closed",
            }
            if clean in mapping:
                return mapping[clean]
        return v


class TicketUpdateResponse(BaseModel):
    success: bool
    updated_at: datetime


class StatsResponse(BaseModel):
    total: int
    open: int
    in_progress: int
    closed: int
    priorities: Dict[TicketPriority, int]
