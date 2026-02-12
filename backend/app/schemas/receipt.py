"""レシートスキーマ"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ReceiptItem(BaseModel):
    name: str
    price: int
    quantity: int = 1


class ReceiptCreate(BaseModel):
    store_name: str = ""
    amount: int
    items: Optional[List[ReceiptItem]] = None
    purchased_at: Optional[datetime] = None


class ReceiptUpdate(BaseModel):
    store_name: Optional[str] = None
    amount: Optional[int] = None
    items: Optional[List[ReceiptItem]] = None


class ReceiptResponse(BaseModel):
    id: int
    user_id: int
    image_url: str
    store_name: str
    amount: int
    items: Optional[str] = None
    purchased_at: Optional[datetime] = None
    status: str
    points_awarded: Optional[int] = None
    rejection_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
