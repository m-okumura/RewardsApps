"""レシートサービス"""
import json
from typing import List, Optional
import os
import uuid
from datetime import datetime
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.receipt import Receipt, ReceiptStatus
from app.models.point_transaction import PointTransaction
from app.schemas.receipt import ReceiptCreate, ReceiptItem


def save_upload_file(file_content: bytes, filename: str, upload_dir: str) -> str:
    """アップロードファイルを保存し、相対パスを返す"""
    Path(upload_dir).mkdir(parents=True, exist_ok=True)
    ext = Path(filename).suffix or ".jpg"
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, unique_name)
    with open(file_path, "wb") as f:
        f.write(file_content)
    return f"/uploads/{unique_name}"


def items_to_json(items: Optional[List[ReceiptItem]]) -> Optional[str]:
    if not items:
        return None
    return json.dumps([item.model_dump() for item in items])


async def create_receipt(
    db: AsyncSession,
    user_id: int,
    image_path: str,
    data: ReceiptCreate,
) -> Receipt:
    """レシート登録"""
    receipt = Receipt(
        user_id=user_id,
        image_url=image_path,
        store_name=data.store_name,
        amount=data.amount,
        items=items_to_json(data.items),
        purchased_at=data.purchased_at,
        status=ReceiptStatus.PENDING.value,
    )
    db.add(receipt)
    await db.flush()
    await db.refresh(receipt)
    return receipt


async def get_user_receipts(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 20,
) -> List[Receipt]:
    """ユーザーのレシート一覧"""
    result = await db.execute(
        select(Receipt)
        .where(Receipt.user_id == user_id)
        .order_by(Receipt.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_receipt_by_id(db: AsyncSession, receipt_id: int, user_id: int) -> Optional[Receipt]:
    """レシート詳細（本人のみ）"""
    result = await db.execute(
        select(Receipt).where(Receipt.id == receipt_id, Receipt.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_receipt_by_id_any(db: AsyncSession, receipt_id: int) -> Optional[Receipt]:
    """レシート詳細（管理者用）"""
    result = await db.execute(select(Receipt).where(Receipt.id == receipt_id))
    return result.scalar_one_or_none()


async def get_all_receipts(
    db: AsyncSession,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Receipt]:
    """全レシート一覧（管理者用）"""
    q = select(Receipt).order_by(Receipt.created_at.desc()).offset(skip).limit(limit)
    if status:
        q = q.where(Receipt.status == status)
    result = await db.execute(q)
    return list(result.scalars().all())


async def update_receipt_status(
    db: AsyncSession,
    receipt_id: int,
    status: str,
    points_awarded: Optional[int] = None,
    rejection_reason: Optional[str] = None,
) -> Optional[Receipt]:
    """レシート審査（承認/却下）"""
    receipt = await get_receipt_by_id_any(db, receipt_id)
    if not receipt:
        return None
    was_pending = receipt.status == ReceiptStatus.PENDING.value
    receipt.status = status
    if points_awarded is not None:
        receipt.points_awarded = points_awarded
    if rejection_reason is not None:
        receipt.rejection_reason = rejection_reason
    if status == ReceiptStatus.APPROVED.value and points_awarded and points_awarded > 0 and was_pending:
        from app.models.point_transaction import PointTransaction
        tx = PointTransaction(
            user_id=receipt.user_id,
            amount=points_awarded,
            type="receipt",
            description=f"レシート承認 #{receipt_id}",
            reference_id=receipt_id,
        )
        db.add(tx)
    await db.flush()
    await db.refresh(receipt)
    return receipt
