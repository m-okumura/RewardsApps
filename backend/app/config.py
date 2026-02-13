"""アプリケーション設定"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """アプリケーション設定"""

    # アプリ
    APP_NAME: str = "ポイ活アプリ"
    DEBUG: bool = False

    # 認証
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # データベース (開発: SQLite / 本番: PostgreSQL)
    DATABASE_URL: str = "sqlite+aiosqlite:///./poi_app.db"

    # ファイルストレージ
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB

    # CORS（本番のフロントURL。カンマ区切りで複数指定可）
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
