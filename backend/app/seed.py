"""初期データ投入"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.survey import Survey


async def seed_surveys():
    """アンケートの初期データ（存在しない場合のみ）"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Survey).limit(1))
        if result.scalar_one_or_none() is not None:
            return

        surveys = [
            Survey(
                title="利用満足度アンケート",
                description="アプリの使いやすさについてご意見をお聞かせください。",
                points=10,
                is_active=True,
            ),
            Survey(
                title="レシート機能について",
                description="レシート撮影・登録の体験はいかがでしたか？",
                points=5,
                is_active=True,
            ),
            Survey(
                title="欲しい交換先は？",
                description="今後追加してほしいポイント交換先を教えてください。",
                points=15,
                is_active=True,
            ),
        ]
        for s in surveys:
            db.add(s)
        await db.commit()
