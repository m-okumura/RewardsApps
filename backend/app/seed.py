"""初期データ投入"""
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.config import get_settings
from app.models.user import User
from app.models.survey import Survey
from app.models.campaign import Campaign, CampaignType


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


async def seed_campaigns():
    """キャンペーンの初期データ"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Campaign).limit(1))
        if result.scalar_one_or_none() is not None:
            return

        campaigns = [
            Campaign(
                title="春のポイントキャンペーン",
                campaign_type=CampaignType.GENERAL,
                description="春限定！ポイント2倍キャンペーン実施中",
                points=100,
                is_active=True,
            ),
            Campaign(
                title="抽選で1000ptプレゼント",
                campaign_type=CampaignType.LOTTERY,
                description="毎週抽選で10名様に1000ptをプレゼント",
                points=1000,
                is_active=True,
            ),
            Campaign(
                title="特定商品購入で高額ポイント",
                campaign_type=CampaignType.QUEST,
                description="提携店で指定商品を購入すると500pt付与",
                points=500,
                is_active=True,
            ),
        ]
        for c in campaigns:
            db.add(c)
        await db.commit()


async def seed_admin():
    """管理者メールのユーザーを管理者に設定"""
    async with AsyncSessionLocal() as db:
        settings = get_settings()
        result = await db.execute(
            select(User).where(User.email == settings.ADMIN_EMAIL)
        )
        user = result.scalar_one_or_none()
        if user and not user.is_admin:
            user.is_admin = True
            await db.commit()
