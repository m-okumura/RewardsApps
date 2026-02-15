"""アンケートサービス"""
from datetime import datetime
import json
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.models.survey import Survey, SurveyAnswer
from app.models.point_transaction import PointTransaction


async def get_active_surveys(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
) -> List[Survey]:
    """回答可能なアンケート一覧"""
    now = datetime.utcnow()
    result = await db.execute(
        select(Survey)
        .where(Survey.is_active == True)
        .where(or_(Survey.expires_at.is_(None), Survey.expires_at > now))
        .order_by(Survey.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_survey_by_id(
    db: AsyncSession,
    survey_id: int,
    active_only: bool = True,
) -> Optional[Survey]:
    """アンケート詳細"""
    q = select(Survey).where(Survey.id == survey_id)
    if active_only:
        q = q.where(Survey.is_active == True)
    result = await db.execute(q)
    return result.scalar_one_or_none()


async def get_survey_by_id_admin(db: AsyncSession, survey_id: int) -> Optional[Survey]:
    """アンケート詳細（管理者用・非公開含む）"""
    return await get_survey_by_id(db, survey_id, active_only=False)


async def list_all_surveys(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
) -> List[Survey]:
    """全アンケート一覧（管理者用）"""
    result = await db.execute(
        select(Survey)
        .order_by(Survey.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def create_survey(
    db: AsyncSession,
    title: str,
    description: Optional[str] = None,
    points: int = 10,
    expires_at: Optional[datetime] = None,
    is_active: bool = True,
) -> Survey:
    """アンケート作成"""
    s = Survey(
        title=title,
        description=description,
        points=points,
        expires_at=expires_at,
        is_active=is_active,
    )
    db.add(s)
    await db.flush()
    await db.refresh(s)
    return s


async def update_survey(
    db: AsyncSession,
    survey_id: int,
    **kwargs,
) -> Optional[Survey]:
    """アンケート更新"""
    result = await db.execute(select(Survey).where(Survey.id == survey_id))
    survey = result.scalar_one_or_none()
    if not survey:
        return None
    for k, v in kwargs.items():
        if hasattr(survey, k):
            setattr(survey, k, v)
    await db.flush()
    await db.refresh(survey)
    return survey


async def has_answered(db: AsyncSession, user_id: int, survey_id: int) -> bool:
    """ユーザーが既に回答済みか"""
    result = await db.execute(
        select(SurveyAnswer).where(
            SurveyAnswer.user_id == user_id,
            SurveyAnswer.survey_id == survey_id,
        )
    )
    return result.scalar_one_or_none() is not None


async def submit_answer(
    db: AsyncSession,
    user_id: int,
    survey_id: int,
    answers: Optional[dict] = None,
) -> tuple[Optional[SurveyAnswer], Optional[str]]:
    """
    アンケート回答送信。ポイント付与。
    戻り値: (SurveyAnswer, error_message)
    """
    survey = await get_survey_by_id(db, survey_id)
    if not survey:
        return None, "アンケートが見つかりません"

    now = datetime.utcnow()
    if survey.expires_at and survey.expires_at < now:
        return None, "このアンケートは締め切り済みです"

    if await has_answered(db, user_id, survey_id):
        return None, "既に回答済みです"

    answers_json = json.dumps(answers, ensure_ascii=False) if answers else None
    answer = SurveyAnswer(
        survey_id=survey_id,
        user_id=user_id,
        answers=answers_json,
    )
    db.add(answer)
    await db.flush()

    # ポイント付与
    tx = PointTransaction(
        user_id=user_id,
        amount=survey.points,
        type="survey",
        description=f"アンケート: {survey.title}",
        reference_id=answer.id,
    )
    db.add(tx)
    await db.flush()
    await db.refresh(answer)
    return answer, None
