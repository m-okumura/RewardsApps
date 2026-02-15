"""管理者API"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.campaign import Campaign
from app.models.survey import Survey
from app.models.announcement import Announcement
from app.schemas.admin import (
    UserListItem,
    UserUpdateActive,
    PointGrantCreate,
    ReceiptReviewUpdate,
    AnalyticsResponse,
    AnnouncementCreate,
    AnnouncementUpdate,
    AnnouncementResponse,
    CampaignCreate,
    CampaignUpdate,
    SurveyCreate,
    SurveyUpdate,
)
from app.schemas.receipt import ReceiptResponse
from app.schemas.campaign import CampaignResponse
from app.schemas.survey import SurveyResponse
from app.services.admin_service import list_users, update_user_active, grant_points, get_analytics
from app.services.receipt_service import get_all_receipts, get_receipt_by_id_any, update_receipt_status
from app.services.campaign_service import list_campaigns, get_campaign_by_id, create_campaign, update_campaign
from app.services.survey_service import list_all_surveys, create_survey, update_survey, get_survey_by_id_admin
from app.core.deps import get_current_admin
from sqlalchemy import select

router = APIRouter(prefix="/admin", tags=["管理者"])


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_admin_analytics(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """分析ダッシュボード"""
    return await get_analytics(db)


@router.get("/users", response_model=List[UserListItem])
async def admin_list_users(
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """ユーザー一覧"""
    users = await list_users(db, search=search, skip=skip, limit=limit)
    return [UserListItem.model_validate(u) for u in users]


@router.patch("/users/{user_id}")
async def admin_update_user(
    user_id: int,
    data: UserUpdateActive,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """ユーザー有効/無効"""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="自分自身を無効にすることはできません")
    user = await update_user_active(db, user_id, data.is_active)
    if not user:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    await db.commit()
    return {"message": "更新しました"}


@router.post("/points/grant")
async def admin_grant_points(
    data: PointGrantCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """ポイント手動付与"""
    tx = await grant_points(db, data.user_id, data.amount, data.description)
    if not tx:
        raise HTTPException(status_code=400, detail="付与に失敗しました")
    await db.commit()
    return {"message": "付与しました", "transaction_id": tx.id}


@router.get("/receipts", response_model=List[ReceiptResponse])
async def admin_list_receipts(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """レシート一覧（審査用）"""
    receipts = await get_all_receipts(db, status=status, skip=skip, limit=limit)
    return [ReceiptResponse.model_validate(r) for r in receipts]


@router.get("/receipts/{receipt_id}", response_model=ReceiptResponse)
async def admin_get_receipt(
    receipt_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """レシート詳細"""
    receipt = await get_receipt_by_id_any(db, receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="レシートが見つかりません")
    return ReceiptResponse.model_validate(receipt)


@router.patch("/receipts/{receipt_id}", response_model=ReceiptResponse)
async def admin_review_receipt(
    receipt_id: int,
    data: ReceiptReviewUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """レシート審査（承認/却下）"""
    receipt = await update_receipt_status(
        db,
        receipt_id,
        data.status,
        points_awarded=data.points_awarded,
        rejection_reason=data.rejection_reason,
    )
    if not receipt:
        raise HTTPException(status_code=404, detail="レシートが見つかりません")
    await db.commit()
    await db.refresh(receipt)
    return ReceiptResponse.model_validate(receipt)


# キャンペーン管理
@router.get("/campaigns", response_model=List[CampaignResponse])
async def admin_list_campaigns(
    active_only: bool = Query(False),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """キャンペーン一覧"""
    campaigns = await list_campaigns(db, active_only=active_only)
    return [CampaignResponse.model_validate(c) for c in campaigns]


@router.post("/campaigns", response_model=CampaignResponse)
async def admin_create_campaign(
    data: CampaignCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """キャンペーン作成"""
    c = await create_campaign(
        db,
        title=data.title,
        campaign_type=data.campaign_type,
        description=data.description,
        points=data.points,
        is_active=data.is_active,
    )
    await db.commit()
    return CampaignResponse.model_validate(c)


@router.patch("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def admin_update_campaign(
    campaign_id: int,
    data: CampaignUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """キャンペーン更新"""
    campaign = await update_campaign(
        db, campaign_id,
        **data.model_dump(exclude_unset=True),
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="キャンペーンが見つかりません")
    await db.commit()
    return CampaignResponse.model_validate(campaign)


# アンケート管理
@router.get("/surveys", response_model=List[SurveyResponse])
async def admin_list_surveys(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """アンケート一覧"""
    surveys = await list_all_surveys(db, skip=skip, limit=limit)
    return [SurveyResponse.model_validate(s) for s in surveys]


@router.post("/surveys", response_model=SurveyResponse)
async def admin_create_survey(
    data: SurveyCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """アンケート作成"""
    from datetime import datetime as dt
    expires_at = None
    if data.expires_at:
        try:
            expires_at = dt.fromisoformat(data.expires_at.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            pass
    s = await create_survey(
        db,
        title=data.title,
        description=data.description,
        points=data.points,
        expires_at=expires_at,
        is_active=data.is_active,
    )
    await db.commit()
    return SurveyResponse.model_validate(s)


@router.patch("/surveys/{survey_id}", response_model=SurveyResponse)
async def admin_update_survey(
    survey_id: int,
    data: SurveyUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """アンケート更新"""
    from datetime import datetime as dt
    updates = data.model_dump(exclude_unset=True)
    if "expires_at" in updates and updates["expires_at"]:
        try:
            updates["expires_at"] = dt.fromisoformat(updates["expires_at"].replace("Z", "+00:00"))
        except (ValueError, TypeError):
            updates.pop("expires_at", None)
    survey = await update_survey(db, survey_id, **updates)
    if not survey:
        raise HTTPException(status_code=404, detail="アンケートが見つかりません")
    await db.commit()
    return SurveyResponse.model_validate(survey)


# お知らせ管理
@router.get("/announcements", response_model=List[AnnouncementResponse])
async def admin_list_announcements(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """お知らせ一覧"""
    result = await db.execute(
        select(Announcement).order_by(Announcement.created_at.desc())
    )
    announcements = list(result.scalars().all())
    return [AnnouncementResponse.model_validate(a) for a in announcements]


@router.post("/announcements", response_model=AnnouncementResponse)
async def admin_create_announcement(
    data: AnnouncementCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """お知らせ作成"""
    a = Announcement(title=data.title, body=data.body, is_active=True)
    db.add(a)
    await db.flush()
    await db.refresh(a)
    await db.commit()
    return AnnouncementResponse.model_validate(a)


@router.patch("/announcements/{announcement_id}", response_model=AnnouncementResponse)
async def admin_update_announcement(
    announcement_id: int,
    data: AnnouncementUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """お知らせ更新"""
    result = await db.execute(select(Announcement).where(Announcement.id == announcement_id))
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="お知らせが見つかりません")
    if data.title is not None:
        a.title = data.title
    if data.body is not None:
        a.body = data.body
    if data.is_active is not None:
        a.is_active = data.is_active
    await db.commit()
    await db.refresh(a)
    return AnnouncementResponse.model_validate(a)
