"""アンケートAPI"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.survey import SurveyResponse, SurveyAnswerCreate
from app.services.survey_service import (
    get_active_surveys,
    get_survey_by_id,
    has_answered,
    submit_answer,
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/surveys", tags=["アンケート"])


@router.get("", response_model=List[SurveyResponse])
async def list_surveys(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """アンケート一覧"""
    surveys = await get_active_surveys(db, skip, limit)
    return surveys


@router.get("/{survey_id}", response_model=SurveyResponse)
async def get_survey(
    survey_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """アンケート詳細"""
    survey = await get_survey_by_id(db, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="アンケートが見つかりません")

    answered = await has_answered(db, current_user.id, survey_id)
    # 詳細レスポンスに回答済みフラグを追加
    res = SurveyResponse.model_validate(survey)
    return res


@router.get("/{survey_id}/answered")
async def check_answered(
    survey_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """回答済みか確認"""
    answered = await has_answered(db, current_user.id, survey_id)
    return {"answered": answered}


@router.post("/{survey_id}/answers")
async def submit_survey_answer(
    survey_id: int,
    data: SurveyAnswerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """アンケート回答送信"""
    answer, error = await submit_answer(
        db, current_user.id, survey_id, data.answers
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    await db.commit()

    survey = await get_survey_by_id(db, survey_id)
    return {
        "id": answer.id,
        "survey_id": survey_id,
        "points_awarded": survey.points,
    }
