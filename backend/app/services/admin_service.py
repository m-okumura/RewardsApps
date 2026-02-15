"""管理者サービス"""
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.user import User
from app.models.point_transaction import PointTransaction
from app.models.exchange import Exchange
from app.models.receipt import Receipt


async def list_users(
    db: AsyncSession,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[User]:
    """ユーザー一覧"""
    q = select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
    if search:
        q = q.where(
            (User.email.ilike(f"%{search}%")) | (User.name.ilike(f"%{search}%"))
        )
    result = await db.execute(q)
    return list(result.scalars().all())


async def update_user_active(db: AsyncSession, user_id: int, is_active: bool) -> Optional[User]:
    """ユーザーの有効/無効を更新"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return None
    user.is_active = is_active
    await db.flush()
    await db.refresh(user)
    return user


async def grant_points(
    db: AsyncSession,
    user_id: int,
    amount: int,
    description: str = "管理者による手動付与",
) -> Optional[PointTransaction]:
    """ポイントを手動付与"""
    tx = PointTransaction(
        user_id=user_id,
        amount=amount,
        type="admin_grant",
        description=description,
    )
    db.add(tx)
    await db.flush()
    await db.refresh(tx)
    return tx


async def get_analytics(db: AsyncSession) -> dict:
    """分析ダッシュボード用集計"""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)

    # ユーザー数
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    new_users_week = (
        await db.execute(
            select(func.count(User.id)).where(User.created_at >= week_start)
        )
    ).scalar() or 0

    # ポイント総付与
    total_points = (
        await db.execute(
            select(func.coalesce(func.sum(PointTransaction.amount), 0)).where(
                PointTransaction.amount > 0
            )
        )
    ).scalar() or 0

    # 交換総数
    exchange_result = await db.execute(
        select(func.coalesce(func.sum(Exchange.amount), 0)).where(
            Exchange.status == "completed"
        )
    )
    total_exchanged = exchange_result.scalar() or 0

    # 審査待ちレシート数
    pending_receipts = (
        await db.execute(
            select(func.count(Receipt.id)).where(Receipt.status == "pending")
        )
    ).scalar() or 0

    return {
        "total_users": total_users,
        "new_users_week": new_users_week,
        "total_points_granted": total_points,
        "total_points_exchanged": total_exchanged,
        "pending_receipts": pending_receipts,
    }
