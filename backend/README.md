# ポイ活アプリ バックエンド

FastAPI で構築した REST API サーバーです。

## セットアップ

### 1. PostgreSQL を Docker で起動

```bash
docker compose up -d postgres
```

### 2. バックエンド

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 起動

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API ドキュメント: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Phase 1 API 一覧

### 認証
- `POST /api/v1/auth/register` - 会員登録
- `POST /api/v1/auth/login` - ログイン
- `POST /api/v1/auth/refresh` - トークン更新

### ユーザー
- `GET /api/v1/users/me` - 自分のプロフィール
- `PATCH /api/v1/users/me` - プロフィール更新

### レシート
- `POST /api/v1/receipts` - レシート登録（画像 + Form）
- `GET /api/v1/receipts` - レシート一覧
- `GET /api/v1/receipts/{id}` - レシート詳細
