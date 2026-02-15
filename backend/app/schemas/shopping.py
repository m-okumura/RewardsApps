"""ショッピングスキーマ"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ShoppingTrackCreate(BaseModel):
    merchant: str = Field(..., max_length=100)
    order_id: Optional[str] = Field(None, max_length=200)
    amount: Optional[int] = Field(None, ge=0)


class ShoppingTrackResponse(BaseModel):
    id: int
    merchant: str
    order_id: Optional[str] = None
    amount: Optional[int] = None
    status: str
    tracked_at: datetime

    class Config:
        from_attributes = True
