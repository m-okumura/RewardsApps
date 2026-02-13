"""ポイ活アプリ バックエンド - メインアプリケーション"""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db
from app.routers import auth, users, receipts, fitness, surveys, points
from app.seed import seed_surveys

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """起動時・終了時の処理"""
    await init_db()
    await seed_surveys()
    # アップロードディレクトリ作成
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    yield
    # 終了時のクリーンアップ


app = FastAPI(
    title=settings.APP_NAME,
    description="ポイ活アプリ API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS (allow_credentials=True のときは allow_origins に "*" は使えない)
# 本番: 環境変数 CORS_ORIGINS に Amplify の URL を追加（カンマ区切り）
# ブラウザは末尾スラッシュなしで Origin を送るため、正規化して揃える
_origins = [x.strip().rstrip("/") for x in settings.CORS_ORIGINS.split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静的ファイル（アップロード画像）
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# APIルーター
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(receipts.router, prefix="/api/v1")
app.include_router(fitness.router, prefix="/api/v1")
app.include_router(surveys.router, prefix="/api/v1")
app.include_router(points.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "ポイ活アプリ API", "docs": "/api/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
