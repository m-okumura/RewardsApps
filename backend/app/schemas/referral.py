"""友達紹介スキーマ"""
from datetime import datetime
from pydantic import BaseModel


class ReferralCodeResponse(BaseModel):
    referral_code: str
    share_url: str = ""

    class Config:
        from_attributes = True


class ReferralHistoryItem(BaseModel):
    id: int
    referred_id: int
    points_awarded: int
    created_at: datetime

    class Config:
        from_attributes = True
