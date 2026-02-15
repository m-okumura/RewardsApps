"""キャンペーンスキーマ"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CampaignResponse(BaseModel):
    id: int
    title: str
    campaign_type: str
    description: Optional[str] = None
    points: Optional[int] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True
