"""ユーザーモデル"""
from datetime import datetime
from typing import List, Optional

from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    nickname: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    receipts: Mapped[List["Receipt"]] = relationship("Receipt", back_populates="user")
    point_transactions: Mapped[List["PointTransaction"]] = relationship(
        "PointTransaction", back_populates="user"
    )
    fitness_logs: Mapped[List["FitnessLog"]] = relationship("FitnessLog", back_populates="user")
    bottle_consumptions: Mapped[List["BottleConsumption"]] = relationship(
        "BottleConsumption", back_populates="user"
    )
    survey_answers: Mapped[List["SurveyAnswer"]] = relationship(
        "SurveyAnswer", back_populates="user"
    )
    exchanges: Mapped[List["Exchange"]] = relationship("Exchange", back_populates="user")
