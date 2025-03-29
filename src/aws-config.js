import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand,
} from '@aws-sdk/client-cognito-identity';

// Amazon Location Serviceの設定
const configureAmplify = () => {
  // 環境変数から認証情報を取得
  const region = import.meta.env.VITE_AWS_REGION || 'ap-northeast-1';
  const identityPoolId = import.meta.env.VITE_AWS_IDENTITY_POOL_ID;
  const geofenceCollectionName = import.meta.env.VITE_AWS_GEOFENCE_COLLECTION_NAME || 'default-geofences';
  
  console.log({region, identityPoolId, geofenceCollectionName}); // デバッグ用

  // 認証情報が設定されているか確認
  if (!identityPoolId) {
    console.error('AWS Identity Pool IDが設定されていません。.envファイルを確認してください。');
    return false;
  }
  
  // Cognito Identity Clientのインスタンス
  const cognitoClient = new CognitoIdentityClient({ region });
  
  // 基本設定オブジェクト
  const config = {
    // Auth設定
    Auth: {
      Cognito: {
        identityPoolId: identityPoolId,
        region: region,
        mandatorySignIn: false, // ゲストでもアクセス可能にする
      }
    },
    // Geo設定
    Geo: {
      AmazonLocationService: {
        region: region,
        maps: {
          items: {
            'explore.map': {
              style: 'VectorEsriStreets',
            },
          },
          default: 'explore.map',
        },
        geofenceCollections: {
          items: [geofenceCollectionName],
          default: geofenceCollectionName,
        },
      },
    },
  };
  
  // Amplifyの設定（カスタム認証プロバイダーを追加）
  Amplify.configure(config, {
    Auth: {
      tokenProvider: {
        async getTokens() {
          return null;
        }
      },
      credentialsProvider: {
        clearCredentialsAndIdentityId() {
          // 認証情報をクリアする処理（必要に応じて実装）
          console.log('認証情報をクリアしました');
        },
        async getCredentialsAndIdentityId() {
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

            const response = {
              credentials: {
                accessKeyId: credentials.AccessKeyId,
                secretAccessKey: credentials.SecretKey,
                sessionToken: credentials.SessionToken,
                expiration: credentials.Expiration,
              },
              identityId: identityId
            };
            console.log('認証情報:', response); // デバッグ用
            
            // Amplify形式で認証情報とidentityIdを返す
            return response;

          } catch (error) {
            console.error('認証情報の取得エラー:', error);
            throw error;
          }
        }
      }
    }
  });
  
  return true;
};

// 認証情報を取得する関数
export const getCredentials = async () => {
  try {
    // 認証セッションを取得
    const session = await fetchAuthSession();
    console.log('Auth Session:', session); // デバッグ用
    
    // credentials が undefined の場合は、空のオブジェクトを返す代わりにエラーをスロー
    if (!session.credentials) {
      console.error('認証情報が取得できませんでした。AWS設定を確認してください。');
      console.error('Session内容:', JSON.stringify(session, null, 2));
      throw new Error('認証情報が取得できませんでした。AWS設定を確認してください。');
    }
    
    // identityIdを取得
    const identityId = session.identityId;
    console.log('Identity ID:', identityId); // デバッグ用
    
    return {
      accessKeyId: session.credentials.accessKeyId,
      secretAccessKey: session.credentials.secretAccessKey,
      sessionToken: session.credentials.sessionToken,
      expiration: session.credentials.expiration,
      identityId: identityId // identityIdを追加
    };
  } catch (error) {
    console.error('認証情報の取得エラー:', error);
    throw error;
  }
};

export default configureAmplify;
