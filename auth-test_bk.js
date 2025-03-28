// AWS認証テストスクリプト
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';

// 認証テスト関数
async function testAuthentication() {
  console.log('AWS認証テストを開始します...');
  
  try {
    // 環境変数から認証情報を取得
    const region = 'ap-northeast-1';
    const identityPoolId = "ap-northeast-1:cc3b4a00-16b6-4f16-b538-b82c90a00b22";

    console.log({region, identityPoolId}); // デバッグ用
    
    console.log('設定情報:');
    console.log(`- リージョン: ${region}`);
    console.log(`- Identity Pool ID: ${identityPoolId}`);
    
    if (!identityPoolId) {
      throw new Error('Identity Pool IDが設定されていません。.envファイルを確認してください。');
    }
    
    // Amplifyの設定
    console.log('Amplifyを設定中...');
    Amplify.configure({
      Auth: {
        identityPoolId: identityPoolId,
        region: region,
        mandatorySignIn: false,
      }
    });
    
    // 認証セッションを取得
    console.log('認証セッションを取得中...');
    const session = await fetchAuthSession();
    
    console.log('認証セッション取得結果:');
    console.log(JSON.stringify(session, null, 2));

    // credentials を非同期に解決（v6ではこれが必要な場合あり）
    const credentials = await Promise.resolve(session.credentials);
    console.log({ credentials }); //debug
    console.log({ session }); //debug
    
    // 認証情報の検証
    if (session.credentials) {
      console.log('認証情報:');
      console.log(`- Access Key ID: ${session.credentials.accessKeyId}`);
      console.log(`- Secret Access Key: ${session.credentials.secretAccessKey ? '取得済み' : '未取得'}`);
      console.log(`- Session Token: ${session.credentials.sessionToken ? '取得済み' : '未取得'}`);
      console.log(`- 有効期限: ${session.credentials.expiration}`);
      
      console.log('\n✅ 認証成功: 認証情報が正常に取得できました。');
    } else {
      console.log('\n❌ 認証失敗: 認証情報が取得できませんでした。');
      console.log('セッションの内容:');
      console.log(session);
    }
    
    // IAMロールの検証
    if (session.identityId) {
      console.log(`\nIdentity ID: ${session.identityId}`);
      console.log('✅ Identity IDが正常に取得できました。');
    } else {
      console.log('\n❌ Identity IDが取得できませんでした。');
    }
    
  } catch (error) {
    console.error('\n❌ 認証テスト中にエラーが発生しました:');
    console.error(error);
  }
}

// テスト実行
testAuthentication().then(() => {
  console.log('\nテスト完了');
});
