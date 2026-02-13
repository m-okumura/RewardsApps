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

※ ポイ活アプリ（ユーザー向け）をブラウザで使う: [4.7 Flutter Web の Netlify デプロイ](#47-flutter-web-の-netlify-デプロイ)

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

### スマートフォンでのアクセス方法

#### 方法 A: Web ブラウザで使う（最も簡単）

**ポイ活アプリ（ユーザー向け）をブラウザで見る場合**

Flutter Web を Netlify にデプロイすると、スマホのブラウザでポイ活アプリ（レシート・ポイント・歩数）が使えます。手順は [4.7 Flutter Web の Netlify デプロイ](#47-flutter-web-の-netlify-デプロイ) を参照してください。

**管理画面（Next.js）をブラウザで見る場合**

1. スマホの **ブラウザ**（Chrome や Safari）を開く
2. Amplify の URL を入力する  
   例: `https://main.xxxxx.amplifyapp.com`
3. ログインまたは新規登録して利用

※ Amplify の URL は **アプリの設定** → **ホスティング** で確認できます。

#### 方法 B: Flutter アプリをスマホにインストールして使う

**Android の場合**

1. PC で APK をビルドする（`<IP>` は Lightsail のパブリック IP）:
   ```powershell
   cd mobile
   C:\flutter\bin\flutter.bat build apk --dart-define=API_URL=http://43.207.105.126:8000/api/v1
   ```
2. 生成された `build/app/outputs/flutter-apk/app-release.apk` をスマホに転送（メール、クラウドストレージ、USB など）
3. スマホで APK を開いてインストール（不明なアプリのインストールを許可する必要がある場合あり）
4. アプリを起動してログイン・新規登録

**iOS の場合**

1. Mac + Xcode が必要
2. USB で iPhone を接続し、以下で実機実行:
   ```bash
   cd mobile
   flutter run -d ios --dart-define=API_URL=http://43.207.105.126:8000/api/v1
   ```
3. または TestFlight で配布

**USB 接続で実機デバッグ（Android）**

PC とスマホを USB で接続し、開発者モードを有効にしたうえで:
```powershell
cd mobile
C:\flutter\bin\flutter.bat run -d android --dart-define=API_URL=http://<IP>:8000/api/v1
```

**注意**:
- `<IP>` は Lightsail インスタンスの **パブリック IPv4 アドレス**
- スマートフォンは携帯回線・Wi‑Fi のどちらでも、インターネット経由で API に接続可能
- 本番向けには、カスタムドメイン + HTTPS の利用を推奨

### 4.7 Flutter Web の Netlify デプロイ

ポイ活アプリ（ユーザー向け・レシート・ポイント・歩数）を **Web ブラウザ** で使えるようにする手順です。無料枠で利用できます。

#### 4.7.1 Flutter Web のビルド

**Cloudflare Tunnel で HTTPS 化した場合**（スマホ・Netlify からの Mixed Content 解消）

```powershell
cd mobile
# ターミナルに表示された実際の URL を使用。rewardsapi-xxx は仮の名前で実在しない
C:\flutter\bin\flutter.bat build web --dart-define=API_URL=https://取得したURL.trycloudflare.com/api/v1
```

**HTTP のまま使う場合**（PC の localhost からのみ）

```powershell
cd mobile
# <IP> を Lightsail のパブリック IP に置き換える
C:\flutter\bin\flutter.bat build web --dart-define=API_URL=http://43.207.105.126:8000/api/v1
```

ビルド完了後、`build/web` フォルダが生成されます。

#### 4.7.2 Netlify へのデプロイ（ドラッグ&ドロップ）

**初回デプロイ**

1. **Netlify アカウント作成**
   - https://www.netlify.com/ にアクセス
   - 「Sign up」でアカウント作成（GitHub やメールで登録、無料）

2. **サイトの作成**
   - ダッシュボードで **「Add new site」** または **「Add new project」** をクリック
   - 「Add your project to Netlify」画面で、下段の **「…or deploy manually」** セクションまでスクロール
   - **「Drag and drop your project folder here」** と表示されたドロップエリアを表示する

3. **フォルダのアップロード**
   - エクスプローラーで `mobile/build/web` フォルダを開く
   - `web` フォルダ**自体**を Netlify のドロップエリアにドラッグ&ドロップ  
     （フォルダの中身ではなく、`web` フォルダをまとめてドロップ）

4. **デプロイ完了**
   - 数十秒でデプロイが完了
   - `https://xxxxx.netlify.app` のような URL が発行される

**再デプロイ（ビルドの更新を反映する場合）**

1. 対象の Netlify プロジェクトを開く（**アクセスしている URL と同じプロジェクト**にデプロイすること）
2. 左メニューで **Deploys** タブをクリック（General や Project details ではない）
3. 「**Deploy site manually**」または「**Drag and drop your site output folder here**」のエリアに、`mobile/build/web` フォルダをドラッグ&ドロップ
4. 変更が反映されない場合は、ブラウザのハードリロード（Ctrl+Shift+R）またはシークレットモードで再確認

5. **スマホでアクセス**
   - スマホのブラウザで発行された URL を開く
   - ポイ活アプリが表示され、ログイン・新規登録・レシート登録が可能

#### 4.7.3 CORS の設定（必須）

Netlify にデプロイした Flutter Web から Lightsail の API を呼ぶには、バックエンドの **CORS_ORIGINS** に Netlify の URL を追加する必要があります。

Lightsail に SSH 接続し、以下を実行します（`<NetlifyのURL>` は実際の URL に置き換え、末尾に `/` は付けない）:

```bash
cd RewardsApps
# 末尾に / は付けない。Netlify と Cloudflare の URL を両方含める
export CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,https://main.d1dwk1xu53dkgl.amplifyapp.com,https://xxxxx.netlify.app,https://xxxxx.trycloudflare.com"
docker compose -f docker-compose.prod.yml up -d --build
```

#### 4.7.4 Netlify プロジェクトの管理

**不要なプロジェクトの削除**

1. プロジェクト一覧で対象の **右矢印（→）** またはプロジェクト名をクリック
2. **Site configuration**（または **Site settings**）を開く
3. 左メニューで **General** を選択し、一番下までスクロール
4. **Delete site** をクリックし、プロジェクト名を入力して確認

**プロジェクトが増えないようにする**

新しいプロジェクトを作らず、**既存プロジェクトに再デプロイ**してください。プロジェクトを開いて **Deploys** タブで「Deploy site manually」に `build/web` フォルダをドラッグ&ドロップすると、そのプロジェクトが更新されます。**デプロイ先と、ブラウザで開いている URL が同じプロジェクトか確認**してください。別プロジェクトにデプロイすると、更新が反映されません。

**プロジェクトを削除した場合**: バックエンドの `CORS_ORIGINS` から削除した Netlify の URL を外し、使用中の Netlify の URL のみ残す。変更後は `docker compose -f docker-compose.prod.yml up -d` で再起動。

#### 4.7.5 ホスティングの無料枠（参考）

| サービス | 無料枠 |
|---------|--------|
| Netlify | 100GB 転送/月、300 ビルド分/月 |
| Firebase Hosting | 10GB ストレージ、360MB/日 転送 |
| GitHub Pages | 無制限（公開リポジトリ） |
| Amplify | 1000 ビルド分/月、15GB 転送 |

デモ用途であれば Netlify の無料枠で十分です。

### アクセスできない場合の確認

1. **Lightsail のファイアウォール**: ネットワーキングで TCP 8000 が開放されているか
2. **コンテナの起動**: `docker compose -f docker-compose.prod.yml ps` で稼働確認
3. **ブラウザで API に直接アクセス**: `http://<IP>:8000/health` が表示されるか確認
4. **Cloudflare 経由の場合**: API ドキュメントは `/docs` ではなく **`/api/docs`**。ルート `/` で `{"message":"..."}` が返れば API は稼働中

---

## 5. 環境変数一覧

### バックエンド（Lightsail / docker-compose.prod.yml）

| 変数名 | 必須 | 説明 | 例 |
|--------|------|------|-----|
| `DATABASE_URL` | ○ | PostgreSQL 接続文字列（コンテナ内は postgres:5432） | プロジェクトで既定済み |
| `SECRET_KEY` | ○ | JWT 署名用秘密鍵（本番で必ず変更） | `openssl rand -hex 32` で生成 |
| `DEBUG` | - | デバッグモード | `false` |
| `CORS_ORIGINS` | - | 許可するオリジン（カンマ区切り）。Amplify・Netlify は `https://`、末尾に `/` なし | `https://main.xxxxx.amplifyapp.com,https://xxxxx.netlify.app` |

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

### Amplify / Netlify から API が呼べない（CORS エラー）

- バックエンドの `CORS_ORIGINS` に Amplify / Netlify の URL が含まれているか確認
- `https://` で指定し、**末尾に `/` は付けない**（`https://hilarious-souffle-5f887c.netlify.app`）
- 変更後は `docker compose -f docker-compose.prod.yml up -d --build` で再起動
- ブラウザの開発者ツール（Console / Network）でエラーメッセージを確認

### スマホで「ClientLoad failed」「Failed to fetch」が出る（Mixed Content）

**原因**: Netlify や Amplify は HTTPS で配信されます。一方、Lightsail の API は `http://` です。ブラウザは **HTTPS ページから HTTP へのリクエストをブロック**します（Mixed Content の制限）。

**`rewardsapi-xxx.trycloudflare.com` で失敗する場合**: `rewardsapi-xxx` はドキュメントの例であり実在しません。ターミナルまたは `/tmp/cloudflared.log` に表示された**実際の Quick Tunnel URL**でビルドし直してください。

**デプロイしたのに変更が反映されない場合**: デプロイ先の Netlify プロジェクトと、アクセスしている URL が同じか確認。別プロジェクトにデプロイしていると古いビルドのまま。また、ブラウザのハードリロード（Ctrl+Shift+R）やシークレットモードでキャッシュを避ける。ビルドに正しい URL が含まれているか確認するには、ローカルで `grep "trycloudflare" mobile/build/web/main.dart.js` を実行して URL を確認できる。

**対処法**:

1. **CORS の確認**  
   `CORS_ORIGINS` に Netlify の URL が含まれているか、末尾の `/` を付けずに設定する。

2. **API を HTTPS で提供する**  
   Lightsail の API を HTTPS 化すると、スマホからのアクセスが可能になります。
   - **Cloudflare Tunnel（無料）**: Lightsail 上で `cloudflared` を実行し、HTTPS の URL を取得する。
   - **Lightsail ロードバランサー**: 有料（約 $18/月）だが、SSL 証明書を設定できる。

3. **一時的な確認**  
   PC のブラウザで `http://localhost` から Flutter Web を開き、API を `http://LightsailのIP:8000` に接続して動作確認する。localhost 同士なら Mixed Content にならない。

#### Cloudflare Tunnel で API を HTTPS 化する（無料）

Lightsail 上で Cloudflare Tunnel を実行すると、API 用の HTTPS URL が無料で取得できます。**ドメインを持っていない場合**は [Quick Tunnel](#quick-tunnel-ドメイン不要) を使用してください。

##### 方法 A: 名前付きトンネル（Cloudflare に追加したドメインがある場合）

1. [Cloudflare Zero Trust（Cloudflare One）](https://one.dash.cloudflare.com/) にアクセスし、アカウント作成（無料）  
   ※ 通常の Cloudflare ダッシュボード（ドメイン管理画面）とは別です。`one.dash.cloudflare.com` を直接開いてください。
2. 左サイドバーで **Networks** → **Connectors** をクリック（Cloudflare Tunnels はこの下に表示される）
3. **Create a tunnel** をクリックし、**Cloudflared** を選択して **Next**
4. トンネル名を入力して **Save tunnel**
5. **Choose an environment** で **Linux** を選択し、表示される **インストールコマンド** をコピー  
   ※ Lightsail は Linux のため、**Windows 用（cloudflared.exe）は使えません**
6. Lightsail に SSH 接続し、コピーしたコマンドを実行（`cloudflared service install` の場合は **`sudo`** を先頭につける）  

   **Linux 用コマンドが表示されない場合**は、以下で手動インストール:
   ```bash
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
   chmod +x cloudflared
   sudo mv cloudflared /usr/local/bin/
   # その後、Cloudflare 画面の「Run manually」のコマンド（token 付き）を sudo 付きで実行
   sudo cloudflared service install <トークン>
   ```
7. **Public Hostname の設定**  
   - トンネル詳細画面で **Edit** ボタンをクリック  
   - **Public Hostname** または **Routes** セクションで **Add a published application route** をクリック  
   - **Subdomain**: `rewardsapi`（任意）  
   - **Domain**: Cloudflare に追加済みのドメインをドロップダウンから選択（例: `example.com`）。**必須**。`trycloudflare.com` は名前付きトンネルでは選べない  
   - **Path**: `/` のまま（全パスを転送）  
   - **URL**: `localhost:8000`（Type は HTTP）  
   ※ **Domain** は Cloudflare アカウントに追加したドメインです。ドメインがない場合は Quick Tunnel を使用してください。
8. 発行される URL（例: `https://rewardsapi.example.com`）を Flutter Web の API URL として使用
9. 次で再ビルド（**必ず実際の URL を使用**。`rewardsapi-xxx` は説明用の仮の名前であり、実在しません）:
   ```powershell
   flutter build web --dart-define=API_URL=https://実際のURL/api/v1
   ```
10. `CORS_ORIGINS` に Netlify の URL と Cloudflare の URL を追加（末尾に `/` は付けない）

##### Quick Tunnel（ドメイン不要）

ドメインを持っていない場合、Quick Tunnel で即座に HTTPS URL を取得できます。**毎回起動で URL が変わる**点に注意してください。

1. 名前付きトンネルの cloudflared サービスを停止:
   ```bash
   sudo systemctl stop cloudflared
   ```
2. Quick Tunnel を起動:
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```
3. ターミナルに表示される `https://xxxx-xxxx-xxxx.trycloudflare.com` をコピー
4. **バックグラウンドで動かす場合**（ターミナルを閉じても維持）:
   ```bash
   nohup cloudflared tunnel --url http://localhost:8000 > /tmp/cloudflared.log 2>&1 &
   ```
   URL を確認する:
   ```bash
   grep "trycloudflare.com" /tmp/cloudflared.log
   ```
5. Flutter Web を**実際の URL**でビルド（`rewardsapi-xxx` は使わない）:
   ```powershell
   flutter build web --dart-define=API_URL=https://取得したURL.trycloudflare.com/api/v1
   ```
6. Netlify に再デプロイ
7. `CORS_ORIGINS` に Netlify の URL と Cloudflare の URL を両方追加

**API の動作確認**  
- ルート: `https://取得したURL.trycloudflare.com/` → `{"message":"ポイ活アプリ API","docs":"/api/docs"}`
- ドキュメント: `https://取得したURL.trycloudflare.com/api/docs` （`/docs` は 404。正しくは `/api/docs`）

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
