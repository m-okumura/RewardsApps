"""レシートAPI"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.receipt import ReceiptCreate, ReceiptResponse, ReceiptItem
from app.services.receipt_service import create_receipt, get_user_receipts, get_receipt_by_id, save_upload_file
from app.core.deps import get_current_user
from app.config import get_settings

router = APIRouter(prefix="/receipts", tags=["レシート"])
settings = get_settings()


@router.post("", response_model=ReceiptResponse)
async def register_receipt(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    image: UploadFile = File(...),
    store_name: str = Form(""),
    amount: int = Form(...),
    purchased_at: Optional[str] = Form(None),
):
    """レシート登録（画像アップロード）"""
    content = await image.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"ファイルサイズは{settings.MAX_UPLOAD_SIZE // (1024*1024)}MB以下にしてください",
        )

    image_path = save_upload_file(content, image.filename or "receipt.jpg", settings.UPLOAD_DIR)

    from datetime import datetime as dt
    purchased_dt = None
    if purchased_at:
        try:
            purchased_dt = dt.fromisoformat(purchased_at.replace("Z", "+00:00"))
        except ValueError:
            pass

    data = ReceiptCreate(
        store_name=store_name,
        amount=amount,
        purchased_at=purchased_dt,
    )
    receipt = await create_receipt(db, current_user.id, image_path, data)
    await db.commit()
    await db.refresh(receipt)
    return receipt


@router.post("/json", response_model=ReceiptResponse)
async def register_receipt_json(
    data: ReceiptCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    image: UploadFile = File(...),
):
    """レシート登録（JSON + 画像）"""
    content = await image.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"ファイルサイズは{settings.MAX_UPLOAD_SIZE // (1024*1024)}MB以下にしてください",
        )
    image_path = save_upload_file(content, image.filename or "receipt.jpg", settings.UPLOAD_DIR)
    receipt = await create_receipt(db, current_user.id, image_path, data)
    await db.commit()
    await db.refresh(receipt)
    return receipt


@router.get("", response_model=List[ReceiptResponse])
async def list_receipts(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """レシート一覧"""
    receipts = await get_user_receipts(db, current_user.id, skip, limit)
    return receipts


@router.get("/buy-back-targets")
async def get_buy_back_targets(
    current_user: User = Depends(get_current_user),
):
    """買取対象商品一覧（Phase 1: スタブ）"""
    return {
        "items": [],
        "message": "買取対象は随時更新されます",
    }


@router.get("/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(
    receipt_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """レシート詳細"""
    receipt = await get_receipt_by_id(db, receipt_id, current_user.id)
    if not receipt:
        raise HTTPException(status_code=404, detail="レシートが見つかりません")
    return receipt
