// identity-test.js
// aws-identity.jsの実装をテストするためのスクリプト

import { getIdentityCredentials, getLocationClient, geofenceCollectionName } from './src/aws-identity.js';
import { ListGeofencesCommand } from '@aws-sdk/client-location';

console.log('Identity Pool認証テストを開始します...');

async function testIdentityAuthentication() {
  try {
    // 認証情報を取得
    console.log('認証情報を取得中...');
    const credentials = await getIdentityCredentials();
    
    console.log('✅ 認証成功: 認証情報を取得できました');
    console.log(`- Access Key ID: ${credentials.accessKeyId}`);
    console.log(`- Secret Access Key: ${credentials.secretAccessKey.slice(0, 4)}...`);
    console.log(`- Session Token: ${credentials.sessionToken.slice(0, 10)}...`);
    console.log(`- 有効期限: ${credentials.expiration}`);
    
    // LocationClientを取得
    console.log('\nLocationClientを初期化中...');
    const locationClient = await getLocationClient();
    console.log('✅ LocationClient初期化成功');
    
    // ジオフェンスのリストを取得してテスト
    console.log('\nジオフェンスリストを取得中...');
    const command = new ListGeofencesCommand({
      CollectionName: geofenceCollectionName
    });
    
    const response = await locationClient.send(command);
    console.log('✅ ジオフェンスリスト取得成功:');
    console.log(`- 取得件数: ${response.Entries?.length || 0}件`);
    if (response.Entries && response.Entries.length > 0) {
      console.log('- 最初のジオフェンス:', response.Entries[0]);
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ 認証テスト中にエラーが発生しました:');
    console.error(error);
    return false;
  }
}

// テスト実行
testIdentityAuthentication().then((success) => {
  if (success) {
    console.log('\n✅ テスト完了: すべてのテストが成功しました');
  } else {
    console.log('\n❌ テスト完了: エラーが発生しました');
  }
});
