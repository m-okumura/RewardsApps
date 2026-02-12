"""ポイント取引モデル"""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PointTransaction(Base):
    __tablename__ = "point_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # 正: 付与, 負: 消費
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # receipt, exchange, bonus, etc.
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    reference_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # receipt_id等
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="point_transactions")
