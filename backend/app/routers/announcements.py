"""お知らせAPI（ユーザー向け）"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.announcement import Announcement
from app.schemas.admin import AnnouncementResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/announcements", tags=["お知らせ"])


@router.get("", response_model=List[AnnouncementResponse])
async def list_announcements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """お知らせ一覧（公開中のみ）"""
    result = await db.execute(
        select(Announcement)
        .where(Announcement.is_active == True)
        .order_by(Announcement.created_at.desc())
    )
    announcements = list(result.scalars().all())
    return [AnnouncementResponse.model_validate(a) for a in announcements]
