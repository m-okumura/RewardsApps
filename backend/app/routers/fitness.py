"""歩数・フィットネスAPI"""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.fitness import (
    FitnessStepsCreate,
    FitnessStepsResponse,
    FitnessPointsResponse,
    BottleConsumeCreate,
)
from app.services.fitness_service import (
    upsert_steps,
    get_total_steps,
    get_consumed_bottles,
    consume_bottles,
    get_recent_logs,
    STEPS_PER_BOTTLE,
    POINTS_PER_BOTTLE,
)
from app.services.point_service import get_balance
from app.core.deps import get_current_user

router = APIRouter(prefix="/fitness", tags=["歩数・フィットネス"])


@router.post("/steps", response_model=FitnessStepsResponse)
async def register_steps(
    data: FitnessStepsCreate,
    target_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """歩数データを登録"""
    log = await upsert_steps(db, current_user.id, data.steps, target_date)
    await db.commit()
    return FitnessStepsResponse(date=log.date, steps=log.steps)


@router.get("/points", response_model=FitnessPointsResponse)
async def get_fitness_points(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """ボトル・ポイント状況"""
    total_steps = await get_total_steps(db, current_user.id)
    consumed_bottles = await get_consumed_bottles(db, current_user.id)
    available_bottles = total_steps // STEPS_PER_BOTTLE - consumed_bottles
    points_from_bottles = consumed_bottles * POINTS_PER_BOTTLE
    balance = await get_balance(db, current_user.id)

    return FitnessPointsResponse(
        total_steps=total_steps,
        available_bottles=max(0, available_bottles),
        consumed_bottles=consumed_bottles,
        points_from_bottles=points_from_bottles,
        balance=balance,
        steps_per_bottle=STEPS_PER_BOTTLE,
        points_per_bottle=POINTS_PER_BOTTLE,
    )


@router.post("/consume")
async def consume_bottles_endpoint(
    data: BottleConsumeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """ボトルを消費してポイント獲得"""
    consumption, error = await consume_bottles(
        db, current_user.id, data.bottles, STEPS_PER_BOTTLE, POINTS_PER_BOTTLE
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    await db.commit()
    return {
        "bottles_consumed": consumption.bottles,
        "points_awarded": consumption.points_awarded,
    }


@router.get("/steps/history")
async def get_steps_history(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """歩数履歴"""
    logs = await get_recent_logs(db, current_user.id, days)
    return [
        {"date": str(log.date), "steps": log.steps}
        for log in logs
    ]
