"""EC購入トラッキングモデル"""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ShoppingTrack(Base):
    __tablename__ = "shopping_tracks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    merchant: Mapped[str] = mapped_column(String(100), nullable=False)  # 提携EC名
    order_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # 注文ID
    amount: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 購入金額(円)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, confirmed, points_awarded
    tracked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="shopping_tracks")
