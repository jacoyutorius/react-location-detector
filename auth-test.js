// AWS SDK v3 を使って、Identity Pool から認可情報を取得するサンプル
import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand,
} from '@aws-sdk/client-cognito-identity';

console.log('AWS認証テストを開始します...');

async function testAuthentication() {
  try {
    const region = 'ap-northeast-1';
    const identityPoolId = 'ap-northeast-1:cc3b4a00-16b6-4f16-b538-b82c90a00b22';

    console.log({ region, identityPoolId });

    if (!identityPoolId) {
      throw new Error('Identity Pool IDが設定されていません。');
    }

    const client = new CognitoIdentityClient({ region });

    // Identity ID を取得（ゲスト）
    console.log('Identity ID を取得中...');
    const getIdResponse = await client.send(
      new GetIdCommand({
        IdentityPoolId: identityPoolId,
      })
    );

    const identityId = getIdResponse.IdentityId;
    if (!identityId) {
      throw new Error('Identity ID が取得できませんでした。');
    }

    console.log(`✅ Identity ID: ${identityId}`);

    // 認可情報（credentials）を取得
    console.log('認証情報を取得中...');
    const credentialsResponse = await client.send(
      new GetCredentialsForIdentityCommand({
        IdentityId: identityId,
      })
    );

    const credentials = credentialsResponse.Credentials;

    if (credentials?.AccessKeyId && credentials?.SecretKey && credentials?.SessionToken) {
      console.log('✅ 認証成功: 認証情報を取得できました');
      console.log(`- Access Key ID: ${credentials.AccessKeyId}`);
      console.log(`- Secret Access Key: ${credentials.SecretKey.slice(0, 4)}...`);
      console.log(`- Session Token: ${credentials.SessionToken.slice(0, 10)}...`);
      console.log(`- 有効期限: ${credentials.Expiration}`);
    } else {
      console.error('❌ 認証失敗: 認可情報が取得できませんでした');
      console.log('credentials:', credentials);
    }
  } catch (err) {
    console.error('\n❌ 認証テスト中にエラーが発生しました:');
    console.error(err);
  }
}

testAuthentication().then(() => {
  console.log('\nテスト完了');
});