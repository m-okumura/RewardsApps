"""ポイント・交換サービス"""
from datetime import datetime
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.point_transaction import PointTransaction
from app.models.exchange import Exchange, ExchangeStatus

EXCHANGE_OPTIONS = [
    {"id": "paypay", "name": "PayPay", "min_amount": 300, "description": "PayPay残高にチャージ"},
    {"id": "rakuten", "name": "楽天ポイント", "min_amount": 300, "description": "楽天ポイントに交換"},
    {"id": "amazon", "name": "Amazonギフト", "min_amount": 500, "description": "Amazonギフト券に交換"},
]


async def get_balance(db: AsyncSession, user_id: int) -> int:
    """ポイント残高"""
    result = await db.execute(
        select(func.coalesce(func.sum(PointTransaction.amount), 0)).where(
            PointTransaction.user_id == user_id
        )
    )
    return int(result.scalar_one() or 0)


async def get_point_history(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
) -> List[PointTransaction]:
    """ポイント履歴"""
    result = await db.execute(
        select(PointTransaction)
        .where(PointTransaction.user_id == user_id)
        .order_by(PointTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def create_exchange(
    db: AsyncSession,
    user_id: int,
    amount: int,
    destination: str,
    destination_detail: Optional[str] = None,
) -> tuple[Optional[Exchange], Optional[str]]:
    """
    ポイント交換申請。
    戻り値: (Exchange, error_message)
    """
    balance = await get_balance(db, user_id)
    if amount > balance:
        return None, "残高が不足しています"

    opt = next((o for o in EXCHANGE_OPTIONS if o["id"] == destination or o["name"] == destination), None)
    min_amount = opt["min_amount"] if opt else 300

    if amount < min_amount:
        return None, f"最低{min_amount}pt以上で交換可能です"

    exchange = Exchange(
        user_id=user_id,
        amount=amount,
        destination=destination,
        destination_detail=destination_detail,
        status=ExchangeStatus.PENDING,
    )
    db.add(exchange)
    await db.flush()

    # ポイント控除
    tx = PointTransaction(
        user_id=user_id,
        amount=-amount,
        type="exchange",
        description=f"交換申請: {destination}",
        reference_id=exchange.id,
    )
    db.add(tx)
    await db.flush()
    await db.refresh(exchange)
    return exchange, None


def get_exchange_options() -> List[dict]:
    """交換先一覧"""
    return EXCHANGE_OPTIONS.copy()
