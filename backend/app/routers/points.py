"""ポイントAPI"""
from typing import List

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.point import (
    PointBalanceResponse,
    PointTransactionResponse,
    ExchangeOptionResponse,
    ExchangeCreate,
    ExchangeResponse,
)
from app.services.point_service import (
    get_balance,
    get_point_history,
    create_exchange,
    get_exchange_options,
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/points", tags=["ポイント"])


@router.get("/balance", response_model=PointBalanceResponse)
async def get_point_balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """ポイント残高"""
    balance = await get_balance(db, current_user.id)
    return PointBalanceResponse(balance=balance)


@router.get("/history", response_model=List[PointTransactionResponse])
async def get_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """ポイント履歴"""
    transactions = await get_point_history(db, current_user.id, skip, limit)
    return transactions


@router.get("/exchange-options", response_model=List[ExchangeOptionResponse])
async def list_exchange_options(
    current_user: User = Depends(get_current_user),
):
    """交換先一覧"""
    options = get_exchange_options()
    return [ExchangeOptionResponse(**o) for o in options]


@router.post("/exchange", response_model=ExchangeResponse)
async def request_exchange(
    data: ExchangeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """ポイント交換申請"""
    exchange, error = await create_exchange(
        db,
        current_user.id,
        data.amount,
        data.destination,
        data.destination_detail,
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    await db.commit()
    return exchange
