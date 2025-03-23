# AWS認証設定手順

このドキュメントでは、GeoLocatorアプリケーションで使用するAWS認証とジオフェンス機能の設定方法について説明します。

## 前提条件

- AWSアカウントを持っていること
- AWS CLIがインストールされていること
- 適切なIAM権限を持っていること

## 1. AWS CLIのインストールと設定

まだAWS CLIをインストールしていない場合は、以下のコマンドでインストールします：

```bash
# macOSの場合
brew install awscli

# Linuxの場合
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windowsの場合
# https://aws.amazon.com/cli/ からインストーラーをダウンロード
```

インストール後、認証情報を設定します：

```bash
aws configure
```

プロンプトに従って、以下の情報を入力します：
- AWS Access Key ID
- AWS Secret Access Key
- Default region name (例: ap-northeast-1)
- Default output format (例: json)

## 2. Cognito Identity Poolの作成

以下のコマンドを実行して、新しいIdentity Poolを作成します：

```bash
aws cognito-identity create-identity-pool \
  --identity-pool-name "GeoLocatorIdentityPool" \
  --allow-unauthenticated-identities \
  --region ap-northeast-1
```

このコマンドでは：
- `--identity-pool-name`: Identity Poolの名前を指定します
- `--allow-unauthenticated-identities`: 認証されていないユーザー（ゲスト）のアクセスを許可します
- `--region`: リージョンを指定します（ap-northeast-1は東京リージョン）

成功すると、以下のようなJSONレスポンスが返ってきます：

```json
{
    "IdentityPoolId": "ap-northeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "IdentityPoolName": "GeoLocatorIdentityPool",
    "AllowUnauthenticatedIdentities": true,
    "AllowClassicFlow": false
}
```

**重要**: 返された`IdentityPoolId`をメモしておいてください。このIDは後で使用します。

## 3. IAMロールの作成

認証されていないユーザー用のIAMロールを作成します。まず、ロールのポリシードキュメントを作成します：

```bash
# trust-policy.json というファイルを作成
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "ap-northeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "unauthenticated"
        }
      }
    }
  ]
}
EOF
```

**注意**: `cognito-identity.amazonaws.com:aud`の値は、ステップ2で取得した`IdentityPoolId`に置き換えてください。

次に、このポリシーを使用してロールを作成します：

```bash
aws iam create-role \
  --role-name CognitoGeoLocatorUnauthRole \
  --assume-role-policy-document file://trust-policy.json
```

## 4. ロールにポリシーをアタッチ

Location Serviceへのアクセス権限を持つポリシーを作成します：

```bash
# location-policy.json というファイルを作成
cat > location-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "geo:GetMapTile",
        "geo:GetMapStyleDescriptor",
        "geo:ListGeofences",
        "geo:GetGeofence",
        "geo:BatchEvaluateGeofences"
      ],
      "Resource": "*"
    }
  ]
}
EOF
```

ポリシーを作成し、ロールにアタッチします：

```bash
# ポリシーを作成
aws iam create-policy \
  --policy-name LocationServicePolicy \
  --policy-document file://location-policy.json

# ポリシーをロールにアタッチ
aws iam attach-role-policy \
  --role-name CognitoGeoLocatorUnauthRole \
  --policy-arn arn:aws:iam::<YOUR_ACCOUNT_ID>:policy/LocationServicePolicy
```

**注意**: `<YOUR_ACCOUNT_ID>`は自分のAWSアカウントIDに置き換えてください。アカウントIDは以下のコマンドで確認できます：

```bash
aws sts get-caller-identity --query "Account" --output text
```

## 5. Identity PoolにIAMロールを設定

作成したロールをIdentity Poolに関連付けます：

```bash
aws cognito-identity set-identity-pool-roles \
  --identity-pool-id "ap-northeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" \
  --roles unauthenticated=arn:aws:iam::<YOUR_ACCOUNT_ID>:role/CognitoGeoLocatorUnauthRole \
  --region ap-northeast-1
```

**注意**: 
- `identity-pool-id`はステップ2で取得したIDに置き換えてください
- `<YOUR_ACCOUNT_ID>`は自分のAWSアカウントIDに置き換えてください

## 6. ジオフェンスコレクションの作成

ジオフェンスを保存するためのコレクションを作成します：

```bash
aws location create-geofence-collection \
  --collection-name "user-geofences" \
  --description "User defined geofences" \
  --region ap-northeast-1
```

## 7. サンプルジオフェンスの追加（オプション）

テスト用のジオフェンスを追加する場合は、以下のコマンドを実行します：

```bash
# 円形ジオフェンスの例（東京駅周辺）
aws location batch-put-geofence \
  --collection-name "user-geofences" \
  --geofence-id "tokyo-station" \
  --geofence '{"Circle": {"Center": [139.7671, 35.6812], "Radius": 500}}' \
  --description "東京駅周辺 500m" \
  --region ap-northeast-1

# 多角形ジオフェンスの例（皇居周辺）
aws location batch-put-geofence \
  --collection-name "user-geofences" \
  --geofence-id "imperial-palace" \
  --geofence '{"Polygon": [[
    [139.7528, 35.6854],
    [139.7528, 35.6757],
    [139.7716, 35.6757],
    [139.7716, 35.6854],
    [139.7528, 35.6854]
  ]]}' \
  --description "皇居周辺エリア" \
  --region ap-northeast-1
```

## 8. アプリケーションの設定

設定が完了したら、アプリケーションの`.env`ファイルに以下の情報を追加します：

```
VITE_AWS_REGION=ap-northeast-1
VITE_AWS_IDENTITY_POOL_ID=ap-northeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_AWS_GEOFENCE_COLLECTION_NAME=user-geofences
```

**注意**: `VITE_AWS_IDENTITY_POOL_ID`はステップ2で取得したIDに置き換えてください。

## トラブルシューティング

### 認証エラー

アプリケーションで認証エラーが発生する場合は、以下を確認してください：

1. `.env`ファイルの`VITE_AWS_IDENTITY_POOL_ID`が正しいか
2. IAMロールのポリシーが正しく設定されているか
3. Identity PoolにIAMロールが正しく関連付けられているか

### ジオフェンスが表示されない

ジオフェンスが表示されない場合は、以下を確認してください：

1. ジオフェンスコレクションが正しく作成されているか
2. ジオフェンスが追加されているか
3. IAMロールにジオフェンスへのアクセス権限があるか

以下のコマンドでジオフェンスの一覧を確認できます：

```bash
aws location list-geofences \
  --collection-name "user-geofences" \
  --region ap-northeast-1
