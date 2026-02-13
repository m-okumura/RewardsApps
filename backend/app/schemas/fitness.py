"""フィットネス・歩数スキーマ"""
from datetime import date
from pydantic import BaseModel, Field


class FitnessStepsCreate(BaseModel):
    steps: int = Field(..., ge=0, le=1000000, description="歩数")


class FitnessStepsResponse(BaseModel):
    date: date
    steps: int

    class Config:
        from_attributes = True


class FitnessPointsResponse(BaseModel):
    total_steps: int
    available_bottles: int
    consumed_bottles: int
    points_from_bottles: int
    balance: int
    steps_per_bottle: int = 10000
    points_per_bottle: int = 10


class BottleConsumeCreate(BaseModel):
    bottles: int = Field(..., ge=1, le=100, description="消費するボトル数")
