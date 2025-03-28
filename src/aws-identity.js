import { LocationClient } from '@aws-sdk/client-location';
import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand,
} from '@aws-sdk/client-cognito-identity';

// 環境変数から設定を読み込む
const region = import.meta.env.VITE_AWS_REGION || 'ap-northeast-1';
const identityPoolId = import.meta.env.VITE_AWS_IDENTITY_POOL_ID;
const geofenceCollectionName = import.meta.env.VITE_AWS_GEOFENCE_COLLECTION_NAME || 'default-geofences';
const mapName = import.meta.env.VITE_AWS_MAP_NAME || 'explore.map';

// Cognito Identity Clientのインスタンス
const cognitoClient = new CognitoIdentityClient({ region });

/**
 * Identity Poolから認証情報を取得する関数
 * @returns {Promise<Object>} AWS認証情報
 */
export const getIdentityCredentials = async () => {
  try {
    console.log('Identity Pool認証情報を取得中...', { region, identityPoolId });

    if (!identityPoolId) {
      throw new Error('AWS Identity Pool IDが設定されていません。.envファイルを確認してください。');
    }

    // Identity ID を取得（ゲスト）
    console.log('Identity ID を取得中...');
    const getIdResponse = await cognitoClient.send(
      new GetIdCommand({
        IdentityPoolId: identityPoolId,
      })
    );

    const identityId = getIdResponse.IdentityId;
    if (!identityId) {
      throw new Error('Identity ID が取得できませんでした。');
    }

    console.log(`Identity ID: ${identityId}`);

    // 認可情報（credentials）を取得
    const credentialsResponse = await cognitoClient.send(
      new GetCredentialsForIdentityCommand({
        IdentityId: identityId,
      })
    );

    const credentials = credentialsResponse.Credentials;

    if (!credentials || !credentials.AccessKeyId || !credentials.SecretKey || !credentials.SessionToken) {
      console.error('認証失敗: 認可情報が取得できませんでした');
      throw new Error('認証情報が取得できませんでした。AWS設定を確認してください。');
    }

    console.log('認証成功: 認証情報を取得できました');
    
    // AWS SDK v3の形式に合わせて認証情報を返す
    return {
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretKey,
      sessionToken: credentials.SessionToken,
      expiration: credentials.Expiration
    };
  } catch (error) {
    console.error('認証情報の取得エラー:', error);
    throw error;
  }
};

/**
 * LocationClientを初期化する関数
 * @returns {Promise<LocationClient>} 初期化されたLocationClient
 */
export const getLocationClient = async () => {
  try {
    // 認証情報を取得
    const credentials = await getIdentityCredentials();
    
    // LocationClientを作成
    return new LocationClient({
      region,
      credentials,
    });
  } catch (error) {
    console.error('LocationClientの初期化エラー:', error);
    throw error;
  }
};

export {
  region,
  identityPoolId,
  geofenceCollectionName,
  mapName
};
