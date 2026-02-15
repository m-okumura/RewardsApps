"""認証スキーマ"""
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str = ""
    referral_code: Optional[str] = None  # 友達紹介コード（登録時）


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str  # user_id
    email: str
    type: str  # access or refresh
    exp: int


class RefreshTokenRequest(BaseModel):
    refresh_token: str
