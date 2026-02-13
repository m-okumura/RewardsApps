"""ポイント交換モデル"""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ExchangeStatus:
    PENDING = "pending"  # 申請中
    PROCESSING = "processing"  # 処理中
    COMPLETED = "completed"  # 完了
    REJECTED = "rejected"  # 却下


class Exchange(Base):
    __tablename__ = "exchanges"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    destination: Mapped[str] = mapped_column(String(100), nullable=False)  # PayPay, 楽天等
    status: Mapped[str] = mapped_column(String(20), default=ExchangeStatus.PENDING)
    destination_detail: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # アカウントID等
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="exchanges")
