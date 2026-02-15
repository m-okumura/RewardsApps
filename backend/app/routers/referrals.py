"""友達紹介API"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.referral import ReferralCodeResponse, ReferralHistoryItem
from app.services.referral_service import get_or_create_referral_code, get_referral_history
from app.core.deps import get_current_user

router = APIRouter(prefix="/referrals", tags=["友達紹介"])


@router.get("/my-code", response_model=ReferralCodeResponse)
async def get_my_referral_code(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """自分の紹介コード取得"""
    code = await get_or_create_referral_code(db, current_user.id)
    await db.commit()
    return ReferralCodeResponse(
        referral_code=code,
        share_url=f"https://example.com/register?ref={code}" if code else "",
    )


@router.get("/history", response_model=List[ReferralHistoryItem])
async def get_my_referral_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """紹介履歴"""
    refs = await get_referral_history(db, current_user.id)
    return [
        ReferralHistoryItem(
            id=r.id,
            referred_id=r.referred_id,
            points_awarded=r.points_awarded,
            created_at=r.created_at,
        )
        for r in refs
    ]
