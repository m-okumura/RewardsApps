"""フィットネス・歩数サービス"""
from datetime import date, datetime, timedelta
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from app.models.fitness_log import FitnessLog, BottleConsumption
from app.models.point_transaction import PointTransaction

STEPS_PER_BOTTLE = 10000
POINTS_PER_BOTTLE = 10


async def upsert_steps(
    db: AsyncSession,
    user_id: int,
    steps: int,
    target_date: Optional[date] = None,
) -> FitnessLog:
    """歩数を登録（同日の既存レコードは更新）"""
    target_date = target_date or date.today()
    result = await db.execute(
        select(FitnessLog).where(
            FitnessLog.user_id == user_id,
            FitnessLog.log_date == target_date,
        )
    )
    log = result.scalar_one_or_none()
    if log:
        log.steps = steps
        log.updated_at = datetime.utcnow()
    else:
        log = FitnessLog(user_id=user_id, steps=steps, log_date=target_date)
        db.add(log)
    await db.flush()
    await db.refresh(log)
    return log


async def get_total_steps(db: AsyncSession, user_id: int) -> int:
    """ユーザーの累計歩数"""
    result = await db.execute(
        select(func.coalesce(func.sum(FitnessLog.steps), 0)).where(
            FitnessLog.user_id == user_id
        )
    )
    return int(result.scalar_one() or 0)


async def get_consumed_bottles(db: AsyncSession, user_id: int) -> int:
    """消費済みボトル数"""
    result = await db.execute(
        select(func.coalesce(func.sum(BottleConsumption.bottles), 0)).where(
            BottleConsumption.user_id == user_id
        )
    )
    return int(result.scalar_one() or 0)


async def consume_bottles(
    db: AsyncSession,
    user_id: int,
    bottles: int,
    steps_per_bottle: int = STEPS_PER_BOTTLE,
    points_per_bottle: int = POINTS_PER_BOTTLE,
) -> tuple[BottleConsumption, Optional[str]]:
    """
    ボトルを消費してポイント獲得。
    戻り値: (BottleConsumption, error_message)
    """
    total_steps = await get_total_steps(db, user_id)
    consumed = await get_consumed_bottles(db, user_id)
    available_bottles = total_steps // steps_per_bottle - consumed

    if bottles > available_bottles:
        return None, f"ボトルが不足しています（利用可能: {available_bottles}）"

    points = bottles * points_per_bottle
    consumption = BottleConsumption(
        user_id=user_id,
        bottles=bottles,
        points_awarded=points,
    )
    db.add(consumption)
    await db.flush()

    # ポイント付与
    tx = PointTransaction(
        user_id=user_id,
        amount=points,
        type="bottle",
        description=f"ボトル{bottles}個消費",
        reference_id=consumption.id,
    )
    db.add(tx)
    await db.flush()
    await db.refresh(consumption)
    return consumption, None


async def get_recent_logs(
    db: AsyncSession,
    user_id: int,
    days: int = 7,
) -> List[FitnessLog]:
    """直近の歩数ログ"""
    start = date.today() - timedelta(days=days)
    result = await db.execute(
        select(FitnessLog)
        .where(FitnessLog.user_id == user_id, FitnessLog.log_date >= start)
        .order_by(FitnessLog.log_date.desc())
    )
    return list(result.scalars().all())
