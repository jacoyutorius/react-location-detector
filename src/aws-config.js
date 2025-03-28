import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';

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
  
  // Amplifyの設定
  Amplify.configure({
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
    
    return {
      accessKeyId: session.credentials.accessKeyId,
      secretAccessKey: session.credentials.secretAccessKey,
      sessionToken: session.credentials.sessionToken,
      expiration: session.credentials.expiration
    };
  } catch (error) {
    console.error('認証情報の取得エラー:', error);
    throw error;
  }
};

export default configureAmplify;
