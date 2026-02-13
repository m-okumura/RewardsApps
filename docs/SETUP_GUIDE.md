# ポイ活アプリ セットアップ手順書（Windows）

本ドキュメントは、RewardsApps を Windows 環境でセットアップする際の手順と、発生しがちな問題の対処法をまとめたものです。

## 目次

1. [前提条件](#1-前提条件)
2. [PostgreSQL（Docker）](#2-postgresqldocker)
3. [バックエンド（FastAPI）](#3-バックエンドfastapi)
4. [フロントエンド（Next.js）](#4-フロントエンドnextjs)
5. [モバイルアプリ（Flutter）](#5-モバイルアプリflutter)
6. [トラブルシューティング一覧](#6-トラブルシューティング一覧)

---

## 1. 前提条件

| ツール | 用途 |
|--------|------|
| **Git** | リポジトリのクローン、Flutter の取得 |
| **Docker Desktop** | PostgreSQL の起動 |
| **Python 3.12〜3.14** | バックエンド |
| **Node.js** | フロントエンド |
| **Flutter** | モバイルアプリ |

---

## 2. PostgreSQL（Docker）

### 2.1 起動手順

```powershell
cd C:\TEMP\RewardsApps
docker compose up -d postgres
```

### 2.2 トラブルシューティング

**ポート 5432 が使用中**

- エラー: `Bind for 0.0.0.0:5432 failed: port is already allocated`
- 対処: `docker-compose.yml` の `ports` を `5433:5432` に変更済み。`backend/.env` の `DATABASE_URL` で `localhost:5433` を使用する。

---

## 3. バックエンド（FastAPI）

### 3.1 セットアップ手順

```powershell
cd C:\TEMP\RewardsApps\backend

# .env を作成（初回のみ）
copy .env.example .env

# 仮想環境の作成
python -m venv venv

# 仮想環境の有効化（PowerShell）
.\venv\Scripts\Activate.ps1

# 依存関係のインストール
pip install -r requirements.txt

# 起動
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000
- ドキュメント: http://localhost:8000/api/docs

### 3.2 トラブルシューティング

**「source」コマンドが認識されない**

- 原因: `source` は bash のコマンド。PowerShell では使えない。
- 対処: `.\venv\Scripts\Activate.ps1` を使用する。
- 参考: CMD の場合は `venv\Scripts\activate.bat`。

**uvicorn が認識されない**

- 原因: 仮想環境が有効になっていないか、`pip install` が失敗している。
- 対処:
  1. `.\venv\Scripts\Activate.ps1` で仮想環境を有効化（プロンプトに `(venv)` が表示されることを確認）
  2. `pip install -r requirements.txt` を再度実行

**pip install が時間がかかる・固まる**

- 原因: Python 3.14 では一部パッケージにビルド済みホイールがなく、ソースからビルドするため時間がかかる。
- 対処: 10〜20 分程度かかることがある。`Preparing metadata` や `Building wheel` 中は待つ。
- 参考: Python 3.12 を使うとビルド済みホイールが多く、数分で完了することが多い。

**Pillow のビルドエラー（KeyError: '__version__'）**

- 原因: Pillow 10.2.0 は Python 3.13+ でビルドエラーになる。
- 対処: `requirements.txt` は `Pillow>=10.4.0` に更新済み。最新の `requirements.txt` を使用する。

**pydantic-core のビルドエラー（Rust/Cargo が必要）**

- 原因: pydantic 2.5.3 の pydantic-core に Python 3.14 用のビルド済みホイールがない。
- 対処: `requirements.txt` は `pydantic>=2.12.0` に更新済み。再インストールする。

**asyncpg / greenlet のビルドエラー**

- 原因: 古いバージョンに Python 3.14 用ホイールがない。
- 対処: `requirements.txt` は `asyncpg>=0.31.0`、`greenlet>=3.1.0` に更新済み。

**SQLAlchemy の AssertionError（TypingOnly）**

- 原因: SQLAlchemy 2.0.25 は Python 3.13/3.14 の型システムと非互換。
- 対処: `requirements.txt` は `sqlalchemy>=2.0.36` に更新済み。

**PostgreSQL に接続できない（Errno 10061）**

- エラー: `OSError: Multiple exceptions: [Errno 10061] Connect call failed ('127.0.0.1', 5433)`
- 原因: PostgreSQL（Docker）が起動していない。
- 対処: いずれかを実行する。
  1. `docker compose up -d postgres` で PostgreSQL を起動する
  2. または SQLite を使う: `backend/.env` の `DATABASE_URL` を `sqlite+aiosqlite:///./poi_app.db` に変更する

### 3.3 Python 3.14 対応 requirements.txt の主なバージョン

| パッケージ | バージョン |
|-----------|------------|
| pydantic | >=2.12.0 |
| pydantic-settings | >=2.1.0 |
| sqlalchemy | >=2.0.36 |
| asyncpg | >=0.31.0 |
| greenlet | >=3.1.0 |
| Pillow | >=10.4.0 |
| email-validator | >=2.2.0 |

---

## 4. フロントエンド（Next.js）

### 4.1 セットアップ手順

```powershell
cd C:\TEMP\RewardsApps\frontend
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く。

---

## 5. モバイルアプリ（Flutter）

### 5.1 Flutter のインストール（未インストールの場合）

**方法 A: Git でクローン**

```powershell
git clone -b stable --depth 1 https://github.com/flutter/flutter.git C:\flutter
```

**方法 B: 公式サイトから ZIP をダウンロード**

- https://docs.flutter.dev/get-started/install/windows
- ZIP を任意のフォルダに解凍（例: `C:\flutter`）

### 5.2 PATH の設定

**環境変数で永続的に追加**

1. **Windows キー** + **R** → `sysdm.cpl` で Enter
2. **詳細設定** → **環境変数**
3. **ユーザー環境変数**の **Path** → **編集** → **新規**
4. `C:\flutter\bin` を追加
5. **OK** で閉じ、**Cursor を再起動**

**その場限りで使う場合**

```powershell
$env:Path += ";C:\flutter\bin"
```

**フルパスで実行**

```powershell
C:\flutter\bin\flutter.bat doctor
```

### 5.3 初回セットアップ

```powershell
# 初回は Dart SDK 等のダウンロードで 5〜10 分かかることがある
C:\flutter\bin\flutter.bat doctor
```

### 5.4 モバイルアプリの起動

```powershell
cd C:\TEMP\RewardsApps\mobile
flutter pub get
flutter run
```

**実行ターゲット**

| ターゲット | コマンド |
|-----------|---------|
| Chrome（Web） | `flutter run -d chrome --web-renderer html` |
| Android エミュレータ | `flutter run -d android` |
| iOS シミュレータ | `flutter run -d ios` |

※ バックエンドが localhost の場合:
- Chrome: `--dart-define=API_URL=http://localhost:8000/api/v1`
- Android エミュレータ: `--dart-define=API_URL=http://10.0.2.2:8000/api/v1`

---

## 6. トラブルシューティング一覧

| 現象 | 原因 | 対処 |
|------|------|------|
| ポート 5432 が使用中 | 既に PostgreSQL 等が動作している | docker-compose のポートを 5433 に変更 |
| `source` が使えない | PowerShell の仕様 | `.\venv\Scripts\Activate.ps1` を使用 |
| uvicorn が認識されない | venv 未激活 or pip 失敗 | venv 有効化後に `pip install` を再実行 |
| pip が 5 分以上固まる | Python 3.14 でソースビルド | そのまま待つ（10〜20 分かかる場合あり） |
| Pillow ビルドエラー | 古い Pillow と Python 3.13+ の非互換 | `Pillow>=10.4.0` を使用 |
| pydantic-core ビルドエラー | Rust が必要な古い版 | `pydantic>=2.12.0` を使用 |
| SQLAlchemy AssertionError | Python 3.13/3.14 非互換 | `sqlalchemy>=2.0.36` を使用 |
| Errno 10061 (PostgreSQL) | DB 未起動 | `docker compose up -d postgres` または SQLite に変更 |
| flutter が認識されない | PATH 未設定 | PATH に `C:\flutter\bin` を追加、またはフルパスで実行 |

---

## 関連ドキュメント

- [README.md](../README.md) - プロジェクト概要・基本的なセットアップ
- [システム仕様書](SPECIFICATION.md) - 機能仕様
- [AWS デプロイ手順書](AWS_DEPLOYMENT.md) - AWS へのデプロイ（月額約 $10 のデモ構成）
