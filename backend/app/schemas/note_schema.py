from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class NoteBase(BaseModel):
    note_text: str = Field(..., min_length=1, max_length=5000, description="Content of the internal note/comment")
    author: Optional[str] = Field("Support Agent", max_length=100, description="Author or agent name")


class NoteCreate(NoteBase):
    pass


class NoteResponse(NoteBase):
    id: int
    ticket_id: str
    created_at: datetime

    class Config:
        from_attributes = True
