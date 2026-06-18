import assert from 'node:assert/strict';
import { getGoogleAudienceIds, verifyGoogleIdToken } from '../utils/googleAuth';

async function testAudienceIdsFromEnv() {
  const original = process.env.GOOGLE_CLIENT_IDS;
  process.env.GOOGLE_CLIENT_IDS = ' client-a.apps.googleusercontent.com,client-b.apps.googleusercontent.com,, ';

  assert.deepEqual(getGoogleAudienceIds(), [
    'client-a.apps.googleusercontent.com',
    'client-b.apps.googleusercontent.com',
  ]);

  process.env.GOOGLE_CLIENT_IDS = original;
}

async function testVerifyUsesGoogleClientAndReturnsPayload() {
  let capturedOptions: any;
  const fakeClient = {
    async verifyIdToken(options: any) {
      capturedOptions = options;
      return {
        getPayload() {
          return {
            email: 'traveler@example.com',
            name: 'Traveler',
            picture: 'https://example.com/avatar.png',
            aud: 'client-a.apps.googleusercontent.com',
          };
        },
      };
    },
  };

  const payload = await verifyGoogleIdToken('token-123', {
    audienceIds: ['client-a.apps.googleusercontent.com'],
    client: fakeClient as any,
  });

  assert.equal(capturedOptions.idToken, 'token-123');
  assert.deepEqual(capturedOptions.audience, ['client-a.apps.googleusercontent.com']);
  assert.equal(payload.email, 'traveler@example.com');
  assert.equal(payload.name, 'Traveler');
}

async function testRejectsPayloadWithoutEmail() {
  const fakeClient = {
    async verifyIdToken() {
      return {
        getPayload() {
          return { aud: 'client-a.apps.googleusercontent.com' };
        },
      };
    },
  };

  await assert.rejects(
    () =>
      verifyGoogleIdToken('token-123', {
        audienceIds: ['client-a.apps.googleusercontent.com'],
        client: fakeClient as any,
      }),
    /Invalid Google token payload/
  );
}

async function testRejectsGoogleVerificationFailure() {
  const fakeClient = {
    async verifyIdToken() {
      throw new Error('wrong audience');
    },
  };

  await assert.rejects(
    () =>
      verifyGoogleIdToken('token-123', {
        audienceIds: ['client-a.apps.googleusercontent.com'],
        client: fakeClient as any,
      }),
    /Invalid Google token/
  );
}

async function run() {
  await testAudienceIdsFromEnv();
  await testVerifyUsesGoogleClientAndReturnsPayload();
  await testRejectsPayloadWithoutEmail();
  await testRejectsGoogleVerificationFailure();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
