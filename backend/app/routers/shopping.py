"""ショッピング・EC購入トラッキングAPI"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.shopping import ShoppingTrackCreate, ShoppingTrackResponse
from app.services.shopping_service import track_purchase, get_track_history
from app.core.deps import get_current_user

router = APIRouter(prefix="/shopping", tags=["ショッピング"])


@router.post("/track", response_model=ShoppingTrackResponse)
async def track_purchase_endpoint(
    data: ShoppingTrackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """EC購入をトラッキング"""
    track = await track_purchase(
        db,
        current_user.id,
        data.merchant,
        data.order_id,
        data.amount,
    )
    await db.commit()
    return ShoppingTrackResponse.model_validate(track)


@router.get("/history", response_model=List[ShoppingTrackResponse])
async def get_my_track_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """トラッキング履歴"""
    tracks = await get_track_history(db, current_user.id)
    return [ShoppingTrackResponse.model_validate(t) for t in tracks]
