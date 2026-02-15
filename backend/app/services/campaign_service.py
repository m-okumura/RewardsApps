"""キャンペーンサービス"""
from datetime import datetime
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.models.campaign import Campaign


async def get_campaign_by_id(db: AsyncSession, campaign_id: int) -> Optional[Campaign]:
    """キャンペーン詳細"""
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    return result.scalar_one_or_none()


async def create_campaign(
    db: AsyncSession,
    title: str,
    campaign_type: str = "general",
    description: Optional[str] = None,
    points: Optional[int] = None,
    start_at: Optional[datetime] = None,
    end_at: Optional[datetime] = None,
    is_active: bool = True,
) -> Campaign:
    """キャンペーン作成"""
    c = Campaign(
        title=title,
        campaign_type=campaign_type,
        description=description,
        points=points,
        start_at=start_at,
        end_at=end_at,
        is_active=is_active,
    )
    db.add(c)
    await db.flush()
    await db.refresh(c)
    return c


async def update_campaign(
    db: AsyncSession,
    campaign_id: int,
    **kwargs,
) -> Optional[Campaign]:
    """キャンペーン更新"""
    campaign = await get_campaign_by_id(db, campaign_id)
    if not campaign:
        return None
    for k, v in kwargs.items():
        if hasattr(campaign, k):
            setattr(campaign, k, v)
    await db.flush()
    await db.refresh(campaign)
    return campaign


async def list_campaigns(
    db: AsyncSession,
    active_only: bool = True,
) -> List[Campaign]:
    """キャンペーン一覧"""
    q = select(Campaign).order_by(Campaign.start_at.desc().nullslast())
    if active_only:
        q = q.where(Campaign.is_active == True)  # noqa: E712
        now = datetime.utcnow()
        q = q.where(
            or_(Campaign.start_at.is_(None), Campaign.start_at <= now)
        ).where(
            or_(Campaign.end_at.is_(None), Campaign.end_at >= now)
        )
    result = await db.execute(q)
    return list(result.scalars().all())
