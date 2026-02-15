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
copy .env.example .env   # 初回のみ（Windows）※ macOS/Linux: cp .env.example .env
python -m venv venv

# 仮想環境を有効化
# Windows PowerShell:  .\venv\Scripts\Activate.ps1
# Windows CMD:        venv\Scripts\activate.bat
# macOS/Linux:        source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000
- ドキュメント: http://localhost:8000/api/docs

**トラブルシューティング (Windows)**

- **ポート5432が使用中**: `docker-compose.yml`のportsを`5433:5432`に変更済み。`backend/.env`の`DATABASE_URL`で`localhost:5433`を使用
- **venv有効化**: PowerShellでは`source`が使えない。`.\venv\Scripts\Activate.ps1`を実行
- **Pillowビルドエラー**: Python 3.13+ではPillow 10.4以上が必要。`requirements.txt`は対応済み

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
| Chrome（Web） | `flutter run -d chrome --no-enable-impeller` |
| macOS | `flutter run -d macos` |

※ **ShaderCompilerException** が出る場合の対処:
  1. `flutter clean`
  2. `--no-enable-impeller` を付けて実行
  3. それでもダメな場合は `--wasm` を試す
| iOS シミュレータ | `flutter run -d ios` |
| Android エミュレータ | `flutter run -d android` |

※ バックエンドが localhost の場合:
- Chrome/macOS: `--dart-define=API_URL=http://localhost:8000/api/v1`
- Android エミュレータ: `--dart-define=API_URL=http://10.0.2.2:8000/api/v1`

## Phase 1 実装内容

- **認証**: 会員登録、ログイン、JWT トークン
- **ユーザー管理**: プロフィール取得・更新
- **レシート**: 撮影・登録・一覧・詳細

## Phase 2 実装内容

- **歩数・ボトル**: 歩数登録、ボトル消費、ポイント獲得
- **アンケート**: アンケート一覧・回答・ポイント付与
- **ポイント**: 残高、履歴、交換申請

## Phase 3 実装内容

- **友達紹介**: 紹介コード取得・共有、登録時の紹介コード入力、紹介者100pt・被紹介者50pt付与
- **キャンペーン**: 抽選・クエスト・買取・一般キャンペーン一覧
- **ショッピング**: EC購入トラッキング（提携EC購入登録・履歴）

## Phase 4 実装内容

- **管理画面**: 運営者向けダッシュボード（管理者のみアクセス可能）
- **分析**: ユーザー数、新規登録、ポイント付与・交換、審査待ちレシート
- **ユーザー管理**: 一覧・検索・有効/無効、ポイント手動付与
- **レシート審査**: 一覧・承認/却下・ポイント付与
- **キャンペーン管理**: 作成・編集
- **アンケート管理**: 作成・編集
- **お知らせ管理**: 作成・編集・公開/非公開

### 管理者としてログインするには

1. `admin@example.com` で新規登録する（`backend/.env` の `ADMIN_EMAIL` で変更可能）
2. または既存ユーザーを DB で `is_admin=1` に更新

## ドキュメント

- [システム仕様書](docs/SPECIFICATION.md)
- [セットアップ手順書（Windows）](docs/SETUP_GUIDE.md) - トラブルシューティング含む
- [AWS デプロイ手順書](docs/AWS_DEPLOYMENT.md)
