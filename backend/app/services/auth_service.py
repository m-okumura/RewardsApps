"""認証サービス"""
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.schemas.auth import UserRegister
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token


async def register_user(db: AsyncSession, data: UserRegister) -> User:
    """新規ユーザー登録"""
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise ValueError("このメールアドレスは既に登録されています")

    user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        name=data.name or data.email.split("@")[0],
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    """メール・パスワードで認証"""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user and verify_password(password, user.password_hash):
        return user
    return None


def create_tokens(user: User) -> dict:
    """アクセス・リフレッシュトークン生成"""
    data = {"sub": str(user.id), "email": user.email}
    return {
        "access_token": create_access_token(data),
        "refresh_token": create_refresh_token(data),
    }


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> Optional[dict]:
    """リフレッシュトークンから新しいアクセストークン生成"""
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        return None

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        return None

    return create_tokens(user)
