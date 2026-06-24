import assert from 'node:assert/strict';
import { getGoogleAudienceIds, verifyGoogleIdToken } from '../utils/googleAuth';

async function testAudienceIdsFromEnv() {
  const original = process.env.GOOGLE_CLIENT_IDS;
  process.env.GOOGLE_CLIENT_IDS = ' client-a.apps.googleusercontent.com,client-b.apps.googleusercontent.com,, ';

  const audienceIds = getGoogleAudienceIds();

  assert.equal(audienceIds[0], 'client-a.apps.googleusercontent.com');
  assert.equal(audienceIds[1], 'client-b.apps.googleusercontent.com');
  assert.ok(
    audienceIds.includes('524802175661-4jmb95kti7c3csqu22ljdccqp66pff6l.apps.googleusercontent.com')
  );
  assert.ok(
    audienceIds.includes('524802175661-62nri3lt2vkio173e1imnt375qt9kjc5.apps.googleusercontent.com')
  );

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
