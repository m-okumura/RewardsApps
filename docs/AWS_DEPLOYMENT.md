# ポイ活アプリ AWS デプロイ手順書（デモ用）

デモ用途を想定した、月額約 **$10** のシンプルな AWS デプロイ手順です。CloudFront や ALB などの高機能は使用しません。

## 目次

1. [アーキテクチャ概要](#1-アーキテクチャ概要)
2. [前提条件](#2-前提条件)
3. [Phase 1: Lightsail でバックエンド構築](#3-phase-1-lightsail-でバックエンド構築)
4. [Phase 2: Amplify でフロントエンド構築](#4-phase-2-amplify-でフロントエンド構築)
5. [環境変数一覧](#5-環境変数一覧)
6. [トラブルシューティング](#6-トラブルシューティング)
7. [付録 A: 参考リンク](#付録-a-参考リンク)
8. [付録 B: デプロイチェックリスト](#付録-b-デプロイチェックリスト)

---

## 1. アーキテクチャ概要

```
┌─────────────────────────┐         ┌─────────────────────────────────┐
│   AWS Amplify           │         │   Amazon Lightsail               │
│   Next.js フロントエンド  │ ──API──▶│   $10/月 インスタンス              │
│   (無料枠内)             │         │   ┌─────────────┬─────────────┐ │
└─────────────────────────┘         │   │ PostgreSQL  │ FastAPI      │ │
                                    │   │ (Docker)    │ (Docker)     │ │
                                    │   │ ポート内部   │ ポート 8000  │ │
                                    │   └─────────────┴─────────────┘ │
                                    └─────────────────────────────────┘
```

### コスト内訳（月額）

| リソース | 構成 | 概算コスト |
|---------|------|-----------|
| Lightsail | $10 プラン（1GB RAM, 1 vCPU, 40GB） | **$10** |
| Amplify | 無料枠（1000 ビルド分/月, 15GB 転送） | **$0** |
| **合計** | | **約 $10/月** |

※ Amplify 無料枠を超えると従量課金。デモであれば通常は無料枠内に収まります。

---

## 2. 前提条件

- AWS アカウント
- [AWS CLI](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-install.html) がインストール・設定済み（Phase 2 の Amplify プラットフォーム変更に必須）
- ローカルに [Docker](https://docs.docker.com/get-docker/) がインストール済み（Lightsail 上でビルドする場合は不要）
- Git がインストール済み

---

## 3. Phase 1: Lightsail でバックエンド構築

### 3.1 Lightsail インスタンスの作成

1. **AWS マネジメントコンソール** → **Lightsail** を開く
2. **インスタンスの作成** をクリック
3. 以下を設定して作成

   | 項目 | 設定値 |
   |------|--------|
   | インスタンスの場所 | 東京（ap-northeast-1） |
   | プラットフォーム | Linux/Unix |
   | ブループリント | OS only → Ubuntu 22.04 |
   | インスタンスプラン | **$10**（1GB RAM, 1 vCPU, 40GB） |

4. インスタンス名: `rewardsapps-demo`（任意）
5. **インスタンスの作成** をクリック

### 3.2 インスタンスへ SSH 接続

**ブラウザから接続する場合**

- インスタンス画面の **接続（Connect）** タブで **Connect using SSH** ボタンをクリックすると、ブラウザ内 SSH ターミナルで接続できます。

**ローカル端末から接続する場合**

1. **接続（Connect）** タブを開く
2. 「Use your own SSH client」セクションで **Public IPv4 address**（例: `43.207.105.126`）と **Username**（`ubuntu`）を確認
3. **SSH key** 欄で、インスタンスに紐づいている鍵の名前を確認する
4. **Account** メニュー → **Account** → **SSH keys** を開き、その鍵を **Download** で .pem ファイルとしてダウンロード
5. ダウンロードしたキーを使って接続

```bash
# 例（キーファイル・IP は実際の値に置き換え。Windows では -i のパスをフルパス・ダブルクォートで指定）
ssh -i "C:\Users\あなたのユーザー名\.ssh\鍵ファイル名.pem" ubuntu@43.207.105.126
```

**`Permission denied (publickey)` が出る場合（鍵が一致しない）**

インスタンス作成時に選択した鍵と、手元の .pem が一致していない可能性があります。**ブラウザ SSH** で接続できる場合、自分の公開鍵をサーバーに追加すればローカルから接続できます。

1. **Connect using SSH** でブラウザからサーバーに接続
2. ローカルで公開鍵を取得: `ssh-keygen -y -f "秘密鍵のパス.pem"`
3. サーバー上で以下を実行（`echo` の引数には**公開鍵のみ**を 1 行で貼り付け。**秘密鍵は絶対に入れない**）:

```bash
mkdir -p ~/.ssh
echo 'ssh-rsa AAAAB3...（公開鍵1行）' >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

4. ローカルから `ssh -i "秘密鍵のパス" ubuntu@IP` で接続

### 3.3 Docker のインストール（インスタンス内）

SSH 接続後、以下を実行します。

```bash
# Docker のインストール
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 現在のユーザーを docker グループに追加
sudo usermod -aG docker $USER
# ログアウトして再ログインするか、以下で一時的に反映
newgrp docker
```

### 3.4 アプリケーションのデプロイ

プロジェクトをインスタンスに配置し、Docker Compose で起動します。

**オプション A: Git でクローン（推奨）**

> **事前確認**: リポジトリに `docker-compose.prod.yml` と `backend/Dockerfile` が含まれていることを確認してください。これらが未コミットの場合は `git clone` で取得できず、ビルドが失敗します。

```bash
# プロジェクトをクローン（プライベートリポジトリの場合は認証が必要）
git clone https://github.com/YOUR_ORG/RewardsApps.git
cd RewardsApps
git pull   # 最新版を取得
```

**オプション B: SCP でファイルを転送**

ローカルで ZIP を作成し、SCP で転送します。

```bash
# ローカル（PowerShell など）で実行
# cd C:\TEMP\RewardsApps
# 必要ファイルを ZIP 化して SCP で転送
```

### 3.5 環境変数と SECRET_KEY の設定

```bash
cd RewardsApps

# SECRET_KEY を生成（32文字以上のランダム文字列）
export SECRET_KEY=$(openssl rand -hex 32)
```

### 3.6 Docker Compose で起動

```bash
# 本番用 docker-compose で起動
docker compose -f docker-compose.prod.yml up -d --build

# ログ確認
docker compose -f docker-compose.prod.yml logs -f
```

バックエンドが起動したら、`http://<LightsailのパブリックIP>:8000` で API にアクセスできることを確認します。

- API: `http://<IP>:8000`
- ドキュメント: `http://<IP>:8000/api/docs`

### 3.7 ファイアウォール（ポート開放）

Lightsail の **ネットワーキング** タブで、以下を追加します。

| アプリケーション | プロトコル | ポート | 送信元 |
|-----------------|-----------|--------|--------|
| **カスタム** | TCP | 8000 | Any IPv4 address |

> **重要**: 「HTTP」を選ぶとポート 80 に固定されます。8000 番を使う場合は必ず **カスタム** を選択してください。
>
> **送信元 IP**: デモ用にどこからでもアクセス可能にする場合は **Any IPv4 address**（Anywhere）を選択。カスタム IPv4 を選んだまま IP 未入力で保存すると「You must allow inbound traffic from at least one IP address...」エラーになります。

これで外部から `http://<パブリックIP>:8000` でアクセスできます。

### 3.8 CORS の設定（Phase 2 完了後）

Amplify の URL を `CORS_ORIGINS` に追加して再起動します（Phase 2 で Amplify URL が確定してから実行）。Amplify は HTTPS なので `https://` で指定し、URL 末尾の `/` は付けません。

```bash
export CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,https://main.xxxxx.amplifyapp.com"
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 4. Phase 2: Amplify でフロントエンド構築

### 4.1 Amplify アプリの作成

1. **AWS Amplify** → **アプリ** → **新しいアプリ** → **ホスティングされた Web アプリ**
2. プロバイダー: **GitHub**（または Bitbucket、GitLab、手動デプロイ）
3. リポジトリ・ブランチを選択
4. ビルド設定はリポジトリルートの `amplify.yml` を自動検出（モノレポ用に `appRoot: frontend` を指定済み）

### 4.2 環境変数の設定

Amplify コンソール → **アプリの設定** → **環境変数** で、以下の変数を追加します。

| 変数名 | 値 |
|--------|-----|
| `NEXT_PUBLIC_API_URL` | `http://<LightsailのパブリックIP>:8000/api/v1` |
| `AMPLIFY_MONOREPO_APP_ROOT` | `frontend` |

> **重要**: モノレポ構成の場合、`AMPLIFY_MONOREPO_APP_ROOT` を設定しないと 404 になることがあります。
>
> **注意**: 本番では HTTPS を推奨します。Lightsail で HTTPS を使う場合はロードバランサー（$18/月）が必要になるため、デモでは HTTP のまま運用する想定です。

### 4.3 プラットフォームを Web コンピュートに変更

Next.js SSR では、プラットフォームを **Web コンピュート**（WEB_COMPUTE）にする必要があります。**コンソールからは変更できないため、AWS CLI で実行**します。

1. **AWS CLI のインストール**（未導入の場合）
   - Windows: `winget install Amazon.AWSCLI --accept-package-agreements`
   - インストール後は **新しいターミナルを開く**か、フルパスで実行: `& "C:\Program Files\Amazon\AWSCLIV2\aws.exe"`

2. **認証の設定**（初回のみ）
   ```powershell
   aws configure
   # AWS Access Key ID、Secret Access Key、Default region (ap-northeast-1) を入力
   ```

3. **プラットフォームの変更**
   ```powershell
   aws amplify update-app --app-id <アプリID> --platform WEB_COMPUTE --region ap-northeast-1
   ```
   アプリ ID は **アプリの設定** → **全般** で確認できます。

4. **サービスロールの設定**（Web コンピュートでは必須）
   **アプリの設定** → **全般** → **編集** → **サービスロールの編集** から、既存ロールを選択するか新規作成してください。

### 4.4 デプロイ

**デプロイの保存** 後、自動でビルド・デプロイが開始されます。初回デプロイが失敗している場合は、プラットフォーム変更後に **リデプロイ** を実行してください。完了後、Amplify が発行する URL（例: `https://main.xxxxx.amplifyapp.com`）でフロントエンドにアクセスできます。

### 4.5 CORS の反映

Amplify の URL を環境変数 `CORS_ORIGINS` に含めて、Lightsail 上でバックエンドを再起動します。

```bash
# Amplify は HTTPS なので https:// を指定。URL 末尾の / は付けない
export CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,https://main.xxxxx.amplifyapp.com"
docker compose -f docker-compose.prod.yml up -d --build
```

> **注意**: Amplify のドメインは HTTPS です。`http://` や末尾に `/` を付けると CORS エラーになることがあります。

コードの編集は不要です。

---

## 4.6 インターネット経由でのアクセス方法

デプロイ後、以下の URL からインターネット経由でアクセスできます。

### Web（管理画面・Next.js）

| 用途 | URL 例 |
|------|--------|
| アプリ | `https://main.xxxxx.amplifyapp.com` |
| 備考 | Amplify コンソールの **ホスティング** で発行された URL を確認 |

### API（バックエンド）

| 用途 | URL 例 |
|------|--------|
| API ベース | `http://<LightsailのパブリックIP>:8000/api/v1` |
| API ドキュメント | `http://<LightsailのパブリックIP>:8000/api/docs` |

例: Lightsail の IP が `43.207.105.126` の場合  
- API: http://43.207.105.126:8000/api/v1  
- ドキュメント: http://43.207.105.126:8000/api/docs  

### モバイルアプリ（Flutter）を AWS に接続する

モバイルアプリから AWS の API に接続するには、**ビルド時に API URL を指定**します。

```powershell
cd mobile

# API URL を Lightsail の IP に設定してビルド・実行
C:\flutter\bin\flutter.bat run -d windows --dart-define=API_URL=http://<LightsailのIP>:8000/api/v1

# Android 実機・エミュレータの場合
C:\flutter\bin\flutter.bat run -d android --dart-define=API_URL=http://<LightsailのIP>:8000/api/v1

# iOS の場合
C:\flutter\bin\flutter.bat run -d ios --dart-define=API_URL=http://<LightsailのIP>:8000/api/v1
```

**注意**:
- `<LightsailのIP>` は Lightsail インスタンスの **パブリック IPv4 アドレス**
- スマートフォン実機で使う場合、端末と PC が同じ Wi‑Fi でなくてもインターネット経由で接続可能
- 本番向けには、カスタムドメイン + HTTPS の利用を推奨

### アクセスできない場合の確認

1. **Lightsail のファイアウォール**: ネットワーキングで TCP 8000 が開放されているか
2. **コンテナの起動**: `docker compose -f docker-compose.prod.yml ps` で稼働確認
3. **ブラウザで API に直接アクセス**: `http://<IP>:8000/health` が表示されるか確認

---

## 5. 環境変数一覧

### バックエンド（Lightsail / docker-compose.prod.yml）

| 変数名 | 必須 | 説明 | 例 |
|--------|------|------|-----|
| `DATABASE_URL` | ○ | PostgreSQL 接続文字列（コンテナ内は postgres:5432） | プロジェクトで既定済み |
| `SECRET_KEY` | ○ | JWT 署名用秘密鍵（本番で必ず変更） | `openssl rand -hex 32` で生成 |
| `DEBUG` | - | デバッグモード | `false` |
| `CORS_ORIGINS` | - | 許可するオリジン（カンマ区切り）。Amplify は `https://`、末尾に `/` なし | `https://main.xxxxx.amplifyapp.com` |

### フロントエンド（Amplify）

| 変数名 | 必須 | 説明 | 例 |
|--------|------|------|-----|
| `NEXT_PUBLIC_API_URL` | ○ | バックエンド API のベース URL | `http://<LightsailのIP>:8000/api/v1` |
| `AMPLIFY_MONOREPO_APP_ROOT` | ○ | モノレポのアプリルート（404 防止） | `frontend` |

---

## 6. トラブルシューティング

### SSH: `Permission denied (publickey)`

- **原因**: 使用中の .pem が、インスタンス作成時に紐づけた鍵と一致していない
- **対処**: [3.2 の「鍵が一致しない場合」](#32-インスタンスへ-ssh-接続) を参照し、ブラウザ SSH で自分の公開鍵を `authorized_keys` に追加する
- **注意**: `authorized_keys` には**公開鍵のみ**を 1 行で追加。秘密鍵（`-----BEGIN RSA PRIVATE KEY-----` ～）を入れると認証が成立せず、セキュリティ上も危険です

### Docker ビルド: `failed to read dockerfile: open Dockerfile: no such file or directory`

- **原因**: `backend/Dockerfile` がリポジトリにコミットされていない
- **対処**: ローカルで `backend/Dockerfile` と `backend/.dockerignore` をコミット・プッシュし、サーバーで `git pull` してから再度 `docker compose` を実行

### `docker-compose.prod.yml: no such file or directory`

- **原因**: 本番用 compose ファイルがリポジトリに含まれていない
- **対処**: `docker-compose.prod.yml` をコミット・プッシュし、サーバーで `git pull` を実行

### Lightsail の 8000 番ポートに接続できない（ERR_CONNECTION_REFUSED）

1. **ファイアウォール**: ネットワーキングで **カスタム / TCP / 8000**、送信元 **Any IPv4 address** が設定されているか確認
2. **コンテナの起動**: `docker compose -f docker-compose.prod.yml ps` でコンテナが起動しているか確認
3. **ローカル確認**: サーバー上で `curl http://127.0.0.1:8000/api/docs` が通るか確認

### ファイアウォール追加時のエラー「You must allow inbound traffic from at least one IP address...」

- **原因**: 送信元に「Custom IPv4 address」を選んだまま、IP を入力していない
- **対処**: デモ用は **Any IPv4 address**（Anywhere）を選択する

### コンテナが起動しない

```bash
docker compose -f docker-compose.prod.yml logs
```

- `postgres` のヘルスチェックが通るまで `backend` は起動しません
- `SECRET_KEY` が未設定の場合は、`export SECRET_KEY=$(openssl rand -hex 32)` を実行してください

### AWS CLI: `aws` コマンドが認識されない（Windows）

- **原因**: インストール直後は PATH が反映されていない、または新しいターミナルを開いていない
- **対処**: フルパスで実行する  
  `& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" amplify update-app ...`  
  または、**新しい PowerShell ウィンドウ**を開いてから `aws` を試す

### Amplify で HTTP 404 が表示される

Next.js をモノレポの `frontend` 以下でデプロイしている場合、404 になることがあります。以下を確認してください。

1. **環境変数**  
   Amplify コンソール → **アプリの設定** → **環境変数** で、次の変数を追加または確認:
   - `AMPLIFY_MONOREPO_APP_ROOT` = `frontend`

2. **プラットフォーム（要: AWS CLI）**  
   プラットフォームが **WEB**（静的）のままだと Next.js SSR は動作しません。**Web コンピュート**（WEB_COMPUTE）への変更は **コンソールからは行えず、AWS CLI で実施**します。  
   手順は [4.3 プラットフォームを Web コンピュートに変更](#43-プラットフォームを-web-コンピュートに変更) を参照。

3. **サービスロール**  
   Web コンピュートでは **サービスロール** が必須です。**アプリの設定** → **全般** → **編集** → **サービスロールの編集** から、既存のロールを選択するか新規作成してください。

4. **再デプロイ**  
   上記を変更したあと、**デプロイ** から「リデプロイ」を実行してください。

### Amplify から API が呼べない（CORS エラー）

- バックエンドの `CORS_ORIGINS` に Amplify の URL が含まれているか確認
- Amplify は HTTPS なので `https://main.xxxxx.amplifyapp.com` 形式で指定（`http://` や末尾の `/` は不可）
- 変更後は `docker compose -f docker-compose.prod.yml up -d --build` で再起動
- ブラウザの開発者ツールでエラーメッセージを確認

### 画像が表示されない

- デモ用ではコンテナ内の `uploads` ボリュームに保存されます
- コンテナ再作成時は画像が消えます。恒久的な保存が必要な場合は S3 連携を検討してください

---

## 付録 A: 参考リンク

- [Amazon Lightsail](https://lightsail.aws.amazon.com/)
- [Amplify Hosting による Next.js のデプロイ](https://docs.amplify.aws/nextjs/)
- [Docker Compose インストール](https://docs.docker.com/compose/install/)
- [AWS CLI インストール](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-install.html)

---

## 付録 B: デプロイチェックリスト

| 項目 | Phase 1 (Lightsail) | Phase 2 (Amplify) |
|------|---------------------|-------------------|
| リポジトリ | `docker-compose.prod.yml`、`backend/Dockerfile`、`backend/.dockerignore` がコミット済み | `amplify.yml` がルートに存在 |
| 環境変数 | `SECRET_KEY` を生成 | `NEXT_PUBLIC_API_URL`、`AMPLIFY_MONOREPO_APP_ROOT` |
| プラットフォーム | - | AWS CLI で `WEB_COMPUTE` に変更 |
| サービスロール | - | 必須（Web コンピュート） |
| ファイアウォール | カスタム / TCP / 8000、送信元 Any IPv4 | - |
| CORS | Amplify URL を `https://` で追加（末尾 `/` なし） | - |
