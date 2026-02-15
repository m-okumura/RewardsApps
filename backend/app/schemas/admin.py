"""管理者用スキーマ"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class UserListItem(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateActive(BaseModel):
    is_active: bool


class PointGrantCreate(BaseModel):
    user_id: int
    amount: int
    description: str = "管理者による手動付与"


class ReceiptReviewUpdate(BaseModel):
    status: str  # approved / rejected
    points_awarded: Optional[int] = None
    rejection_reason: Optional[str] = None


class AnalyticsResponse(BaseModel):
    total_users: int
    new_users_week: int
    total_points_granted: int
    total_points_exchanged: int
    pending_receipts: int


class AnnouncementCreate(BaseModel):
    title: str
    body: Optional[str] = None


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    is_active: Optional[bool] = None


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    body: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CampaignCreate(BaseModel):
    title: str
    campaign_type: str = "general"
    description: Optional[str] = None
    points: Optional[int] = None
    is_active: bool = True


class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    campaign_type: Optional[str] = None
    description: Optional[str] = None
    points: Optional[int] = None
    is_active: Optional[bool] = None


class SurveyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    points: int = 10
    expires_at: Optional[str] = None
    is_active: bool = True


class SurveyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    points: Optional[int] = None
    expires_at: Optional[str] = None
    is_active: Optional[bool] = None
