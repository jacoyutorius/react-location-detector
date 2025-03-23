# GeoLocator

Amazon Location Serviceを利用した位置情報検出アプリケーションです。ユーザーの現在位置を取得し、地図上に表示します。また、Amazon Location Serviceで事前に定義されたジオフェンスを使用して、ユーザーがそのエリア内にいるかどうかを検出することもできます。

## 最新の変更点

- Amazon Location Serviceのジオフェンス機能を追加
- aws-amplify最新バージョンに対応
- 環境変数の設定を拡張

## 実装方針

### 技術スタック

- **フロントエンド**: React + Vite
- **地図ライブラリ**: MapLibre GL JS
- **位置情報API**: ブラウザのGeolocation API
- **地図サービス**: Amazon Location Service（フォールバックとしてOpenStreetMap）
- **ジオフェンス**: Amazon Location Service Geofencing API
- **認証**: Amazon Cognito Identity Pool

### 主要コンポーネント

1. **Map.jsx**: 地図表示と位置情報取得の中心コンポーネント
   - MapLibre GL JSを使用した地図の初期化
   - Geolocation APIを使用した現在位置の取得
   - Geolocation APIのwatchPosition()メソッドを使用した位置情報の監視
   - 位置情報のマーカー表示と位置変更時の自動更新
   - 地図のリセット機能
   - ジオフェンス機能の表示/非表示切り替え

2. **Geofence.jsx**: ジオフェンス機能の中心コンポーネント
   - 円形および多角形ジオフェンスの作成
   - ジオフェンスの一覧表示と管理
   - ユーザーの位置情報とジオフェンスの関係評価
   - ジオフェンスの視覚的表示

3. **App.jsx**: アプリケーションのメインコンポーネント
   - ヘッダー、フッター、メインコンテンツの構造

### 実装のポイント

- **フォールバックメカニズム**: Amazon Location Serviceへのアクセスに問題がある場合、OpenStreetMapを使用
- **環境変数**: Amazon Location ServiceのAPIキーとAWS認証情報を`.env`ファイルで管理
- **レスポンシブデザイン**: モバイルデバイスでも使いやすいUI
- **ジオフェンス機能**: 
  - Amazon Location Serviceで事前に定義されたジオフェンスを使用
  - リアルタイムでユーザーの位置とジオフェンスの関係を評価
  - ジオフェンス内/外の視覚的表示（内部：緑、外部：青）
- **AWS認証**:
  - Amazon Cognito Identity Poolを使用した安全な認証
  - 一時的なAWS認証情報を使用してLocation Serviceにアクセス

## セットアップ手順

1. リポジトリをクローン
   ```
   git clone <リポジトリURL>
   cd geolocator
   ```

2. 依存関係をインストール
   ```
   npm install
   ```

3. 環境変数の設定
   - `.env`ファイルを作成し、必要な環境変数を設定
   ```
   VITE_MAP_API_KEY=<あなたのAPIキー>
   VITE_AWS_REGION=<AWSリージョン>
   VITE_AWS_IDENTITY_POOL_ID=<認証用IDプールID>
   VITE_AWS_GEOFENCE_COLLECTION_NAME=<ジオフェンスコレクション名>
   ```

4. 開発サーバーを起動
   ```
   npm run dev
   ```

## 使用方法

1. アプリケーションにアクセス（開発時は http://localhost:5173）
2. 「現在位置を取得」ボタンをクリックして位置情報へのアクセスを許可
   - 現在位置が地図上にマーカーで表示され、詳細情報（緯度、経度、精度、取得時刻）が下部に表示
3. 「位置情報を監視」ボタンをクリックして位置情報の継続的な監視を開始
   - 位置情報が変更されるたびに、マップ上のマーカーが自動的に更新されます
   - 監視中は「監視を停止」ボタンが表示され、クリックすると監視を停止できます
   - 監視中は位置情報表示部分に「位置情報を監視中...」と表示されます
4. 「リセット」ボタンで地図を初期状態に戻し、監視も停止します
5. 「ジオフェンス表示」ボタンをクリックしてジオフェンス機能を表示
   - Amazon Location Serviceで事前に定義されたジオフェンスが地図上に表示されます
   - ジオフェンス一覧にジオフェンスが表示され、ユーザーがジオフェンス内にいるかどうかが視覚的に表示されます
   - ジオフェンスをクリックすると、詳細情報がポップアップで表示されます

## 注意事項

- ブラウザの位置情報へのアクセス許可が必要です
- 位置情報の監視機能はバッテリー消費が増加する可能性があります
- 移動中に使用する場合は、データ通信量にご注意ください
- Amazon Location ServiceのAPIキーとAWS認証情報は公開リポジトリにコミットしないでください
- ジオフェンス機能を使用するには、事前にAmazon Location Serviceでジオフェンスコレクションを作成し、ジオフェンスを定義しておく必要があります
- また、適切なIAMポリシーを設定して、ジオフェンスコレクションへのアクセス権限を付与する必要があります
- 本番環境にデプロイする場合は、適切なセキュリティ対策を講じてください

## AWS設定手順

1. **Amazon Cognito Identity Pool作成**
   - AWSコンソールでCognito Identity Poolを作成
   - 認証されていないアクセスを有効化
   - 適切なIAMロールを設定（Location Serviceへのアクセス権限を付与）

2. **Amazon Location Serviceの設定**
   - ジオフェンスコレクションを作成
   - 必要なジオフェンスを定義（円形または多角形）
   - 作成したジオフェンスコレクションへのアクセス権限をIAMロールに付与

3. **環境変数の設定**
   ```
   VITE_MAP_API_KEY=<あなたのAPIキー>
   VITE_AWS_REGION=<AWSリージョン>
   VITE_AWS_IDENTITY_POOL_ID=<認証用IDプールID>
   VITE_AWS_GEOFENCE_COLLECTION_NAME=<ジオフェンスコレクション名>
   ```

## ファイル構造

```
geolocator/
├── .env                # 環境変数（APIキー、AWS認証情報）
├── public/             # 静的ファイル
├── src/
│   ├── App.jsx         # メインアプリケーションコンポーネント
│   ├── App.css         # アプリケーションのスタイル
│   ├── Map.jsx         # 地図コンポーネント
│   ├── Map.css         # 地図コンポーネントのスタイル
│   ├── Geofence.jsx    # ジオフェンスコンポーネント
│   ├── Geofence.css    # ジオフェンスコンポーネントのスタイル
│   ├── aws-config.js   # AWS設定
│   ├── services/       # サービス
│   │   └── GeofenceService.js # ジオフェンスサービス
│   ├── main.jsx        # エントリーポイント
│   └── assets/         # アセットファイル
├── index.html          # HTMLテンプレート
└── package.json        # プロジェクト設定
```
