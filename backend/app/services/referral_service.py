"""友達紹介サービス"""
import secrets
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.referral import Referral
from app.models.point_transaction import PointTransaction

REFERRER_POINTS = 100  # 紹介者へのポイント
REFERRED_POINTS = 50   # 被紹介者へのポイント（オプション）


def _generate_code() -> str:
    """8文字の紹介コード生成"""
    return secrets.token_urlsafe(6).upper()[:8].replace("-", "A").replace("_", "B")


async def get_or_create_referral_code(db: AsyncSession, user_id: int) -> str:
    """ユーザーの紹介コードを取得。なければ生成して保存"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return ""

    if user.referral_code:
        return user.referral_code

    for _ in range(10):
        code = _generate_code()
        existing = await db.execute(select(User).where(User.referral_code == code))
        if existing.scalar_one_or_none() is None:
            user.referral_code = code
            await db.flush()
            return code

    return ""


async def process_referral_on_register(
    db: AsyncSession,
    referral_code: Optional[str],
    new_user_id: int,
) -> None:
    """
    新規登録時の紹介処理。
    紹介コードが有効なら紹介者・被紹介者にポイント付与
    """
    if not referral_code or not referral_code.strip():
        return

    code = referral_code.strip().upper()
    result = await db.execute(select(User).where(User.referral_code == code))
    referrer = result.scalar_one_or_none()
    if not referrer or referrer.id == new_user_id:
        return

    # 重複チェック: 同じ被紹介者で既に処理済みでないか
    dup = await db.execute(
        select(Referral).where(Referral.referred_id == new_user_id)
    )
    if dup.scalar_one_or_none():
        return

    # Referralレコード作成
    referral = Referral(
        referrer_id=referrer.id,
        referred_id=new_user_id,
        referral_code=code,
        points_awarded=REFERRER_POINTS,
    )
    db.add(referral)
    await db.flush()

    # 紹介者にポイント付与
    tx_referrer = PointTransaction(
        user_id=referrer.id,
        amount=REFERRER_POINTS,
        type="referral",
        description="友達紹介ボーナス",
        reference_id=referral.id,
    )
    db.add(tx_referrer)

    # 被紹介者にもポイント付与（ウェルカムボーナス）
    tx_referred = PointTransaction(
        user_id=new_user_id,
        amount=REFERRED_POINTS,
        type="referral_bonus",
        description="紹介で登録した方へのボーナス",
        reference_id=referral.id,
    )
    db.add(tx_referred)


async def get_referral_history(db: AsyncSession, user_id: int) -> List[Referral]:
    """自分が紹介した人の履歴"""
    result = await db.execute(
        select(Referral)
        .where(Referral.referrer_id == user_id)
        .order_by(Referral.created_at.desc())
    )
    return list(result.scalars().all())
