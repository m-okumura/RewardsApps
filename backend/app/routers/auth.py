"""認証API"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.auth import UserRegister, UserLogin, Token, RefreshTokenRequest
from app.services.auth_service import register_user, authenticate_user, create_tokens, refresh_access_token

router = APIRouter(prefix="/auth", tags=["認証"])


@router.post("/register", response_model=dict)
async def register(
    data: UserRegister,
    db: AsyncSession = Depends(get_db),
):
    """会員登録"""
    try:
        user = await register_user(db, data)
        await db.commit()
        tokens = create_tokens(user)
        return {
            "message": "登録が完了しました",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
            },
            **tokens,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=Token)
async def login(
    data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """ログイン"""
    user = await authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
        )
    tokens = create_tokens(user)
    return Token(**tokens)


@router.post("/refresh", response_model=Token)
async def refresh(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """トークン更新"""
    tokens = await refresh_access_token(db, data.refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="リフレッシュトークンが無効です",
        )
    return Token(**tokens)
