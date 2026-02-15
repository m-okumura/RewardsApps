"""ショッピング・EC購入トラッキングサービス"""
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.shopping_track import ShoppingTrack


async def track_purchase(
    db: AsyncSession,
    user_id: int,
    merchant: str,
    order_id: Optional[str] = None,
    amount: Optional[int] = None,
) -> ShoppingTrack:
    """EC購入をトラッキング"""
    track = ShoppingTrack(
        user_id=user_id,
        merchant=merchant,
        order_id=order_id,
        amount=amount,
        status="pending",
    )
    db.add(track)
    await db.flush()
    await db.refresh(track)
    return track


async def get_track_history(
    db: AsyncSession,
    user_id: int,
    limit: int = 50,
) -> List[ShoppingTrack]:
    """トラッキング履歴"""
    result = await db.execute(
        select(ShoppingTrack)
        .where(ShoppingTrack.user_id == user_id)
        .order_by(ShoppingTrack.tracked_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
