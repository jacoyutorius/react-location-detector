# React Location Detector

Amazon Location Serviceを利用した位置情報検出アプリケーションです。ユーザーの現在位置を取得し、地図上に表示します。

## 実装方針

### 技術スタック

- **フロントエンド**: React + Vite
- **地図ライブラリ**: MapLibre GL JS
- **位置情報API**: ブラウザのGeolocation API
- **地図サービス**: Amazon Location Service（フォールバックとしてOpenStreetMap）

### 主要コンポーネント

1. **Map.jsx**: 地図表示と位置情報取得の中心コンポーネント
   - MapLibre GL JSを使用した地図の初期化
   - Geolocation APIを使用した現在位置の取得
   - 位置情報のマーカー表示
   - 地図のリセット機能

2. **App.jsx**: アプリケーションのメインコンポーネント
   - ヘッダー、フッター、メインコンテンツの構造

### 実装のポイント

- **フォールバックメカニズム**: Amazon Location Serviceへのアクセスに問題がある場合、OpenStreetMapを使用
- **環境変数**: Amazon Location ServiceのAPIキーを`.env`ファイルで管理
- **レスポンシブデザイン**: モバイルデバイスでも使いやすいUI

## セットアップ手順

1. リポジトリをクローン
   ```
   git clone <リポジトリURL>
   cd react-location-detector
   ```

2. 依存関係をインストール
   ```
   npm install
   ```

3. 環境変数の設定
   - `.env`ファイルを作成し、Amazon Location ServiceのAPIキーを設定
   ```
   VITE_MAP_API_KEY=<あなたのAPIキー>
   ```

4. 開発サーバーを起動
   ```
   npm run dev
   ```

## 使用方法

1. アプリケーションにアクセス（開発時は http://localhost:5173）
2. 「現在位置を取得」ボタンをクリックして位置情報へのアクセスを許可
3. 現在位置が地図上にマーカーで表示され、詳細情報（緯度、経度、精度、取得時刻）が下部に表示
4. 「リセット」ボタンで地図を初期状態に戻す

## 注意事項

- ブラウザの位置情報へのアクセス許可が必要です
- Amazon Location ServiceのAPIキーは公開リポジトリにコミットしないでください
- 本番環境にデプロイする場合は、適切なセキュリティ対策を講じてください

## ファイル構造

```
react-location-detector/
├── .env                # 環境変数（APIキー）
├── public/             # 静的ファイル
├── src/
│   ├── App.jsx         # メインアプリケーションコンポーネント
│   ├── App.css         # アプリケーションのスタイル
│   ├── Map.jsx         # 地図コンポーネント
│   ├── Map.css         # 地図コンポーネントのスタイル
│   ├── main.jsx        # エントリーポイント
│   └── assets/         # アセットファイル
├── index.html          # HTMLテンプレート
└── package.json        # プロジェクト設定
```
