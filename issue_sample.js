import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';

async function test() {
  try {
    Amplify.configure({
      Auth: {
        identityPoolId: 'ap-northeast-1:cc3b4a00-16b6-4f16-b538-b82c90a00b22',
        region: 'ap-northeast-1'
      }
    });

    const session = await fetchAuthSession();
    console.log({ session });
    const credentials = await Promise.resolve(session.credentials);

    console.log('identityId:', session.identityId);
    console.log('credentials:', credentials);
  } catch (err) {
    console.error('Error during fetchAuthSession():', err);
  }
}

test();