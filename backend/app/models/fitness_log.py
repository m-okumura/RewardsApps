"""歩数・フィットネスログモデル"""
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FitnessLog(Base):
    __tablename__ = "fitness_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    steps: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="fitness_logs")


class BottleConsumption(Base):
    """ボトル消費記録（歩数→ボトル→ポイント変換）"""
    __tablename__ = "bottle_consumptions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    bottles: Mapped[int] = mapped_column(Integer, nullable=False)  # 消費したボトル数
    points_awarded: Mapped[int] = mapped_column(Integer, nullable=False)  # 付与ポイント
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="bottle_consumptions")
