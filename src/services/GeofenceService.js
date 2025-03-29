import { LocationClient, 
  ListGeofencesCommand, 
  GetGeofenceCommand,
  BatchEvaluateGeofencesCommand
} from '@aws-sdk/client-location';
import { getCredentials } from '../aws-config';

// ジオフェンスコレクション名（環境変数から取得）
const GEOFENCE_COLLECTION_NAME = import.meta.env.VITE_AWS_GEOFENCE_COLLECTION_NAME || 'default-geofences';
// デフォルトのデバイスID（identityIdが取得できない場合のフォールバック）
const DEFAULT_DEVICE_ID = 'default-device';

// Amazon Location Serviceクライアントの初期化
const getLocationClient = async () => {
  try {
    // 認証情報を取得
    const credentials = await getCredentials();
    console.log({ credentials }); //debug
    
    // リージョンを環境変数から取得
    const region = import.meta.env.VITE_AWS_REGION || 'ap-northeast-1';
    
    // Location Serviceクライアントを作成
    const locationClient = new LocationClient({
      region,
      credentials,
    });
    
    return locationClient;
  } catch (error) {
    console.error('Location Serviceクライアントの初期化エラー:', error);
    throw error;
  }
};


/**
 * すべてのジオフェンスを取得する
 * @returns {Promise<Array>} - ジオフェンスの配列
 */
export const listGeofences = async () => {
  try {
    const client = await getLocationClient();
    
    const command = new ListGeofencesCommand({
      CollectionName: GEOFENCE_COLLECTION_NAME,
    });
    
    const response = await client.send(command);
    return response.Entries || [];
  } catch (error) {
    console.error('ジオフェンス一覧取得エラー:', error);
    throw error;
  }
};

/**
 * 特定のジオフェンスを取得する
 * @param {string} geofenceId - ジオフェンスのID
 * @returns {Promise<Object>} - ジオフェンス情報
 */
export const getGeofence = async (geofenceId) => {
  try {
    const client = await getLocationClient();
    
    const command = new GetGeofenceCommand({
      CollectionName: GEOFENCE_COLLECTION_NAME,
      GeofenceId: geofenceId,
    });
    
    const response = await client.send(command);
    return response;
  } catch (error) {
    console.error(`ジオフェンス取得エラー (ID: ${geofenceId}):`, error);
    throw error;
  }
};

/**
 * 現在位置がジオフェンス内にあるかを評価する
 * @param {number} longitude - 現在位置の経度
 * @param {number} latitude - 現在位置の緯度
 * @returns {Promise<Object>} - 評価結果
 */
export const evaluateGeofences = async (longitude, latitude) => {
  try {
    // 認証情報を取得
    const credentials = await getCredentials();
    // identityIdをデバイスIDとして使用（なければデフォルト値を使用）
    const deviceId = credentials.identityId || DEFAULT_DEVICE_ID;
    console.log(`デバイスID: ${deviceId}`); // デバッグ用
    
    const client = await getLocationClient();
    
    // ジオフェンスを評価
    const evaluateCommand = new BatchEvaluateGeofencesCommand({
      CollectionName: GEOFENCE_COLLECTION_NAME,
      DevicePositionUpdates: [
        {
          DeviceId: deviceId, // 動的なデバイスIDを使用
          Position: [longitude, latitude],
          SampleTime: new Date(),
        },
      ],
    });
    
    const response = await client.send(evaluateCommand);
    return response;
  } catch (error) {
    console.error('ジオフェンス評価エラー:', error);
    throw error;
  }
};
