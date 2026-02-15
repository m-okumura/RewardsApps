# ポイ活アプリ モバイル

Flutter で構築した iOS / Android アプリです。

## セットアップ

Flutter をインストール後:

```bash
cd mobile
flutter create .  # プラットフォームファイルを生成（初回のみ）
flutter pub get
```

## 実行

### Chrome（Web）

ShaderCompilerException が出る場合は `--no-enable-impeller` を付けて実行:

```bash
flutter clean
flutter run -d chrome --no-enable-impeller --dart-define=API_URL=http://localhost:8000/api/v1
```

### エミュレータ/実機

```bash
flutter run
```

### API URL の変更

本番環境などで API の URL を変更する場合:

```bash
flutter run --dart-define=API_URL=https://your-api.com/api/v1
```

## Phase 1 機能

- 会員登録・ログイン
- プロフィール表示
- レシート撮影・登録
- レシート一覧

## 権限

- カメラ: レシート撮影に必要
