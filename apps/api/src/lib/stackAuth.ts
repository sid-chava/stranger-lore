import { createRemoteJWKSet, JWTPayload, jwtVerify, type JWTVerifyOptions } from 'jose';

const STACK_PROJECT_ID = process.env.STACK_PROJECT_ID;

if (!STACK_PROJECT_ID) {
  throw new Error('STACK_PROJECT_ID environment variable is required for Stack Auth verification');
}

const STACK_API_BASE_URL = process.env.STACK_API_BASE_URL || 'https://api.stack-auth.com';
const includeAnonymous = process.env.STACK_JWKS_INCLUDE_ANONYMOUS === 'true';
const jwksPath = `/api/v1/projects/${STACK_PROJECT_ID}/.well-known/jwks.json${includeAnonymous ? '?include_anonymous=true' : ''}`;
const jwksUrl = new URL(jwksPath, STACK_API_BASE_URL);

const JWKS = createRemoteJWKSet(jwksUrl);

const expectedIssuer = process.env.STACK_JWT_ISSUER;
const expectedAudience = process.env.STACK_JWT_AUDIENCE;

const verifyOptions: JWTVerifyOptions = {};
if (expectedIssuer) {
  verifyOptions.issuer = expectedIssuer;
}
if (expectedAudience) {
  verifyOptions.audience = expectedAudience;
}

export type VerifiedStackAuthToken = {
  stackAuthId: string;
  payload: JWTPayload;
};

export async function verifyStackAuthToken(token: string): Promise<VerifiedStackAuthToken> {
  try {
    const { payload } = await jwtVerify(token, JWKS, verifyOptions);

    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new Error('Invalid Stack Auth token: missing subject');
    }

    return {
      stackAuthId: payload.sub,
      payload,
    };
  } catch (error: any) {
    const reason = error?.message || 'Unknown reason';
    throw new Error(`Stack Auth verification failed: ${reason}`);
  }
}
