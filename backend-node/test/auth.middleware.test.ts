import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { CryptoKey, generateKeyPair, SignJWT } from 'jose';
import { errorHandler } from '../src/shared/middleware/error.middleware';
import { authenticateToken } from '../src/shared/middleware/auth.middleware';

vi.mock('dotenv', () => ({
  default: {
    config: () => undefined,
  },
}));

const state = vi.hoisted(() => {
  process.env.KEYCLOAK_URL = 'http://keycloak.local:8080';
  process.env.KEYCLOAK_REALM = 'nutria';
  process.env.KEYCLOAK_ISSUER = 'http://keycloak.local:8080/realms/nutria';
  process.env.KEYCLOAK_AUDIENCE = 'nutria-api';

  return { getKey: vi.fn() };
});

vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jose')>();
  return {
    ...actual,
    createRemoteJWKSet: vi.fn(() => state.getKey),
  };
});

const KEYCLOAK_ISSUER = 'http://keycloak.local:8080/realms/nutria';
const KEYCLOAK_AUDIENCE = 'nutria-api';

let privateKey: CryptoKey;
let publicKey: CryptoKey;
let otherPrivateKey: CryptoKey;

function createTestApp(): express.Express {
  const app = express();
  app.get('/protected', authenticateToken, (req: Request, res: Response) => {
    res.status(200).json({ keycloakUserId: req.user?.keycloakUserId });
  });
  app.use(errorHandler);
  return app;
}

interface SignTokenOptions {
  issuer?: string;
  audience?: string;
  subject?: string;
  expirationTime?: string | number;
  signingKey?: CryptoKey;
}

function signToken(options: SignTokenOptions = {}): Promise<string> {
  const jwt = new SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setIssuer(options.issuer ?? KEYCLOAK_ISSUER)
    .setAudience(options.audience ?? KEYCLOAK_AUDIENCE)
    .setExpirationTime(options.expirationTime ?? '5m');

  if (options.subject !== undefined) {
    jwt.setSubject(options.subject);
  }

  return jwt.sign(options.signingKey ?? privateKey);
}

beforeAll(async () => {
  const keyPair = await generateKeyPair('RS256', { extractable: true });
  privateKey = keyPair.privateKey;
  publicKey = keyPair.publicKey;

  const otherKeyPair = await generateKeyPair('RS256', { extractable: true });
  otherPrivateKey = otherKeyPair.privateKey;
});

beforeEach(() => {
  state.getKey.mockReset();
  state.getKey.mockResolvedValue(publicKey);
});

describe('authenticateToken', () => {
  it('responds 401 when the Authorization header is missing', async () => {
    const response = await request(createTestApp()).get('/protected');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: 'ERROR',
      message: 'Missing or invalid Authorization header',
    });
  });

  it('responds 401 when the Authorization header is not a Bearer token', async () => {
    const response = await request(createTestApp())
      .get('/protected')
      .set('Authorization', 'Basic dXNlcjpwYXNz');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: 'ERROR',
      message: 'Missing or invalid Authorization header',
    });
  });

  it('responds 401 when the Bearer header has no token', async () => {
    const response = await request(createTestApp())
      .get('/protected')
      .set('Authorization', 'Bearer');

    expect(response.status).toBe(401);
  });

  it('responds 401 when the token signature is invalid', async () => {
    const token = await signToken({ subject: 'user-123', signingKey: otherPrivateKey });

    const response = await request(createTestApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: 'ERROR',
      message: 'Invalid or expired token',
    });
  });

  it('responds 401 when the token is expired', async () => {
    const token = await signToken({
      subject: 'user-123',
      expirationTime: Math.floor(Date.now() / 1000) - 60,
    });

    const response = await request(createTestApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid or expired token');
  });

  it('responds 401 when the issuer is incorrect', async () => {
    const token = await signToken({
      subject: 'user-123',
      issuer: 'http://otro.local/realms/nutria',
    });

    const response = await request(createTestApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid or expired token');
  });

  it('responds 401 when the audience is incorrect', async () => {
    const token = await signToken({ subject: 'user-123', audience: 'otra-api' });

    const response = await request(createTestApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid or expired token');
  });

  it('responds 401 when the token has no subject', async () => {
    const token = await signToken();

    const response = await request(createTestApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid or expired token');
  });

  it('responds 401 when the subject is empty', async () => {
    const token = await signToken({ subject: '' });

    const response = await request(createTestApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid or expired token');
  });

  it('attaches the identity and calls next for a valid token', async () => {
    const token = await signToken({ subject: 'user-123' });

    const response = await request(createTestApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ keycloakUserId: 'user-123' });
  });

  it('responds 503 and does not leak details when the JWKS cannot be retrieved', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    state.getKey.mockRejectedValueOnce(new Error('network down'));
    const token = await signToken({ subject: 'user-123' });

    const response = await request(createTestApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: 'ERROR',
      message: 'Authentication service unavailable',
    });
    expect(JSON.stringify(response.body)).not.toContain('network down');
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
