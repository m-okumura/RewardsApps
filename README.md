# ポイ活アプリ

日常生活のついでにポイントを貯めるポイ活アプリケーションです。

## プロジェクト構成

```
RewardsApps/
├── backend/     # FastAPI (Python)
├── frontend/    # Next.js (TypeScript) 管理画面
├── mobile/      # Flutter (Dart) モバイルアプリ
└── docs/        # 仕様書
```

## Phase 1 セットアップ

### 1. PostgreSQL（Docker）

```bash
docker compose up -d postgres
```

### 2. バックエンド

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000
- ドキュメント: http://localhost:8000/api/docs

### 3. フロントエンド（管理画面）

```bash
cd frontend
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開き、新規登録またはログイン。

### 4. モバイルアプリ

```bash
cd mobile
flutter create .   # 初回のみ（プラットフォームファイル生成）
flutter pub get
flutter run
```

※ `flutter` コマンドは **mobile** ディレクトリで実行してください（backend ではありません）

**実行方法**

| ターゲット | コマンド |
|-----------|---------|
| Chrome（Web） | `flutter run -d chrome --web-renderer html` |
| macOS | `flutter run -d macos` |
| iOS シミュレータ | `flutter run -d ios` |
| Android エミュレータ | `flutter run -d android` |

※ バックエンドが localhost の場合:
- Chrome/macOS: `--dart-define=API_URL=http://localhost:8000/api/v1`
- Android エミュレータ: `--dart-define=API_URL=http://10.0.2.2:8000/api/v1`

## Phase 1 実装内容

- **認証**: 会員登録、ログイン、JWT トークン
- **ユーザー管理**: プロフィール取得・更新
- **レシート**: 撮影・登録・一覧・詳細

## ドキュメント

- [システム仕様書](docs/SPECIFICATION.md)
