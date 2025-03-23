import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';

// Amazon Location Serviceの設定
const configureAmplify = () => {
  // 環境変数から認証情報を取得
  const region = import.meta.env.VITE_AWS_REGION || 'ap-northeast-1';
  const identityPoolId = import.meta.env.VITE_AWS_IDENTITY_POOL_ID;
  const geofenceCollectionName = import.meta.env.VITE_AWS_GEOFENCE_COLLECTION_NAME || 'default-geofences';
  
  // 認証情報が設定されているか確認
  if (!identityPoolId) {
    console.error('AWS Identity Pool IDが設定されていません。.envファイルを確認してください。');
    return false;
  }
  
  // Amplifyの設定
  Amplify.configure({
    Auth: {
      Cognito: {
        identityPoolId: identityPoolId,
        region: region,
      }
    },
    geo: {
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
    const session = await fetchAuthSession();
    return session.credentials;
  } catch (error) {
    console.error('認証情報の取得エラー:', error);
    throw error;
  }
};

export default configureAmplify;
