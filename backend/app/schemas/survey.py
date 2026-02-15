"""アンケートスキーマ"""
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class SurveyResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    points: int
    is_active: bool = True
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SurveyAnswerCreate(BaseModel):
    answers: Optional[dict[str, Any]] = None  # 自由形式の回答


class SurveyAnswerResponse(BaseModel):
    id: int
    survey_id: int
    points_awarded: int

    class Config:
        from_attributes = True
