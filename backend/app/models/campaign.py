"""キャンペーンモデル"""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CampaignType:
    LOTTERY = "lottery"  # 抽選
    QUEST = "quest"  # クエスト（特定商品購入で高額ポイント）
    BUYBACK = "buyback"  # 買取商品
    GENERAL = "general"  # その他


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    campaign_type: Mapped[str] = mapped_column(String(20), default=CampaignType.GENERAL)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    points: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 付与ポイント
    start_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
