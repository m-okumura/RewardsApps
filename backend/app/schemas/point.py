"""ポイント・交換スキーマ"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PointBalanceResponse(BaseModel):
    balance: int
    updated_at: Optional[datetime] = None


class PointTransactionResponse(BaseModel):
    id: int
    amount: int
    type: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ExchangeOptionResponse(BaseModel):
    id: str
    name: str
    min_amount: int
    description: Optional[str] = None


class ExchangeCreate(BaseModel):
    amount: int = Field(..., ge=300, description="最低300pt以上")
    destination: str = Field(..., min_length=1, max_length=100)
    destination_detail: Optional[str] = Field(None, max_length=500)


class ExchangeResponse(BaseModel):
    id: int
    amount: int
    destination: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
