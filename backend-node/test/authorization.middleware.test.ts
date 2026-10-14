import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { CryptoKey, generateKeyPair, SignJWT } from 'jose';
import { errorHandler } from '../src/shared/middleware/error.middleware';
import { authenticateToken } from '../src/shared/middleware/auth.middleware';
import { requirePermission } from '../src/modules/security/middleware/authorization.middleware';
import { AccessAuthorizationService } from '../src/modules/security/services/access-authorization.service';
import type {
  AccessAuthorizationRepository,
  AccessRecord,
} from '../src/modules/security/repositories/access/access-authorization.repository';
import { OracleBusinessError } from '../src/infrastructure/database/oracle/oracle.errors';

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

const enabledAccess: AccessRecord = {
  accesoId: 7,
  keycloakUserId: 'user-123',
  rolId: 1,
  estado: 'ACTIVO',
};

let privateKey: CryptoKey;
let publicKey: CryptoKey;

interface FakeRepositoryOptions {
  access?: AccessRecord | null;
  permission?: boolean;
  findError?: unknown;
}

function createService(options: FakeRepositoryOptions): AccessAuthorizationService {
  const repository: AccessAuthorizationRepository = {
    findByKeycloakUserId: vi.fn(async () => {
      if (options.findError !== undefined) {
        throw options.findError;
      }
      return options.access ?? null;
    }),
    hasPermission: vi.fn(async () => options.permission ?? false),
  };

  return new AccessAuthorizationService(repository);
}

function createTestApp(service: AccessAuthorizationService): express.Express {
  const app = express();

  app.get(
    '/protected',
    authenticateToken,
    requirePermission('ACCESO_CREAR', service),
    (req: Request, res: Response) => {
      res.status(200).json({ keycloakUserId: req.user?.keycloakUserId });
    },
  );

  app.get('/orphan', requirePermission('ACCESO_CREAR', service), (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use(errorHandler);
  return app;
}

function signToken(subject = 'user-123'): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setIssuer(KEYCLOAK_ISSUER)
    .setAudience(KEYCLOAK_AUDIENCE)
    .setExpirationTime('5m')
    .setSubject(subject)
    .sign(privateKey);
}

beforeAll(async () => {
  const keyPair = await generateKeyPair('RS256', { extractable: true });
  privateKey = keyPair.privateKey;
  publicKey = keyPair.publicKey;
});

beforeEach(() => {
  state.getKey.mockReset();
  state.getKey.mockResolvedValue(publicKey);
});

describe('requirePermission (full authentication + authorization chain)', () => {
  it('allows the operation for a valid token with an enabled access and the required permission', async () => {
    const app = createTestApp(createService({ access: enabledAccess, permission: true }));
    const token = await signToken();

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ keycloakUserId: 'user-123' });
  });

  it('responds 403 when the authenticated user has no access linked in NUTRIA', async () => {
    const app = createTestApp(createService({ access: null }));
    const token = await signToken();

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      status: 'ERROR',
      message: 'Authenticated user has no access in NUTRIA',
    });
  });

  it('responds 403 when the linked access is disabled', async () => {
    const app = createTestApp(
      createService({ access: { ...enabledAccess, estado: 'INACTIVO' }, permission: true }),
    );
    const token = await signToken();

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Access is disabled');
  });

  it('responds 403 when the access lacks the required permission', async () => {
    const app = createTestApp(createService({ access: enabledAccess, permission: false }));
    const token = await signToken();

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Insufficient permissions');
  });

  it('responds 503 without leaking details when Oracle is unavailable', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = createTestApp(
      createService({ findError: new OracleBusinessError('ORA-12541: TNS:no listener') }),
    );
    const token = await signToken();

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: 'ERROR',
      message: 'Authorization service unavailable',
    });
    expect(JSON.stringify(response.body)).not.toContain('ORA-12541');
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('responds 401 when there is no valid token', async () => {
    const app = createTestApp(createService({ access: enabledAccess, permission: true }));

    const response = await request(app).get('/protected');

    expect(response.status).toBe(401);
  });

  it('responds 401 when the authorization middleware runs without an authenticated identity', async () => {
    const app = createTestApp(createService({ access: enabledAccess, permission: true }));

    const response = await request(app).get('/orphan');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });
});
