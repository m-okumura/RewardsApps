"""キャンペーンAPI"""
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.campaign import CampaignResponse
from app.services.campaign_service import list_campaigns
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/campaigns", tags=["キャンペーン"])


@router.get("", response_model=List[CampaignResponse])
async def list_active_campaigns(
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """キャンペーン一覧"""
    campaigns = await list_campaigns(db, active_only=active_only)
    return [CampaignResponse.model_validate(c) for c in campaigns]
