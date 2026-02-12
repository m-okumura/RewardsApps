"""ユーザーAPI"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.core.deps import get_current_user

router = APIRouter(prefix="/users", tags=["ユーザー"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """自分のプロフィール取得"""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """プロフィール更新"""
    if data.name is not None:
        current_user.name = data.name
    if data.nickname is not None:
        current_user.nickname = data.nickname
    await db.commit()
    await db.refresh(current_user)
    return current_user
