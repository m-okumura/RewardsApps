"""レシートモデル"""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class ReceiptStatus(str, enum.Enum):
    PENDING = "pending"  # 審査待ち
    APPROVED = "approved"  # 承認
    REJECTED = "rejected"  # 却下


class Receipt(Base):
    __tablename__ = "receipts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    store_name: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # 合計金額（円）
    items: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON文字列で商品リスト
    purchased_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # 購入日時
    status: Mapped[str] = mapped_column(String(20), default=ReceiptStatus.PENDING.value)
    points_awarded: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 付与ポイント
    rejection_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="receipts")
