import { OAuth2Client, TokenPayload } from 'google-auth-library';

const DEFAULT_GOOGLE_CLIENT_IDS = [
  '524802175661-eqh020259d1r1da0rp6lr2c626crrg97.apps.googleusercontent.com',
  '524802175661-ubek35mvbpg4m2ociktb484us6prr6oq.apps.googleusercontent.com',
  '524802175661-4jmb95kti7c3csqu22ljdccqp66pff6l.apps.googleusercontent.com',
  '524802175661-62nri3lt2vkio173e1imnt375qt9kjc5.apps.googleusercontent.com',
];

type GoogleTokenVerifier = Pick<OAuth2Client, 'verifyIdToken'>;

interface VerifyGoogleIdTokenOptions {
  audienceIds?: string[];
  client?: GoogleTokenVerifier;
}

export function getGoogleAudienceIds(): string[] {
  const idsFromEnv = process.env.GOOGLE_CLIENT_IDS?.split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  return Array.from(new Set([...(idsFromEnv ?? []), ...DEFAULT_GOOGLE_CLIENT_IDS]));
}

export async function verifyGoogleIdToken(
  idToken: string,
  options: VerifyGoogleIdTokenOptions = {}
): Promise<TokenPayload> {
  const audience = options.audienceIds ?? getGoogleAudienceIds();
  const client = options.client ?? new OAuth2Client();

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience,
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      throw new Error('Invalid Google token payload');
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid Google token payload') {
      throw error;
    }
    throw new Error('Invalid Google token');
  }
}
