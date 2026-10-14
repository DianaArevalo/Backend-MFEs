import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('dotenv', () => ({
  default: {
    config: () => undefined,
  },
}));

const KEYCLOAK_ENV_VARS = [
  'KEYCLOAK_URL',
  'KEYCLOAK_REALM',
  'KEYCLOAK_ISSUER',
  'KEYCLOAK_AUDIENCE',
] as const;

function setValidEnv(): void {
  process.env.KEYCLOAK_URL = 'http://localhost:8080';
  process.env.KEYCLOAK_REALM = 'nutria';
  process.env.KEYCLOAK_ISSUER = 'http://localhost:8080/realms/nutria';
  process.env.KEYCLOAK_AUDIENCE = 'nutria-api';
}

async function loadKeycloakConfigModule() {
  vi.resetModules();
  return import('../src/shared/config/keycloak.config');
}

afterEach(() => {
  for (const name of KEYCLOAK_ENV_VARS) {
    delete process.env[name];
  }
  vi.resetModules();
});

describe('keycloak.config', () => {
  it('builds issuer, audience and the JWKS URL from environment variables', async () => {
    setValidEnv();

    const { loadKeycloakConfig } = await loadKeycloakConfigModule();
    const keycloakConfig = loadKeycloakConfig();

    expect(keycloakConfig.issuer).toBe('http://localhost:8080/realms/nutria');
    expect(keycloakConfig.audience).toBe('nutria-api');
    expect(keycloakConfig.jwksUri.href).toBe(
      'http://localhost:8080/realms/nutria/protocol/openid-connect/certs',
    );
  });

  it('derives the JWKS URL from the URL and realm without duplicating values', async () => {
    setValidEnv();
    process.env.KEYCLOAK_URL = 'http://keycloak.local:8080/';
    process.env.KEYCLOAK_REALM = 'otro-realm';

    const { loadKeycloakConfig } = await loadKeycloakConfigModule();

    expect(loadKeycloakConfig().jwksUri.href).toBe(
      'http://keycloak.local:8080/realms/otro-realm/protocol/openid-connect/certs',
    );
  });

  it('throws when KEYCLOAK_URL is missing', async () => {
    setValidEnv();
    delete process.env.KEYCLOAK_URL;

    const { loadKeycloakConfig, KeycloakConfigError } = await loadKeycloakConfigModule();

    expect(() => loadKeycloakConfig()).toThrow(KeycloakConfigError);
    expect(() => loadKeycloakConfig()).toThrow('KEYCLOAK_URL');
  });

  it('throws when KEYCLOAK_REALM is missing', async () => {
    setValidEnv();
    delete process.env.KEYCLOAK_REALM;

    const { loadKeycloakConfig, KeycloakConfigError } = await loadKeycloakConfigModule();

    expect(() => loadKeycloakConfig()).toThrow(KeycloakConfigError);
    expect(() => loadKeycloakConfig()).toThrow('KEYCLOAK_REALM');
  });

  it('throws when KEYCLOAK_ISSUER is missing', async () => {
    setValidEnv();
    delete process.env.KEYCLOAK_ISSUER;

    const { loadKeycloakConfig, KeycloakConfigError } = await loadKeycloakConfigModule();

    expect(() => loadKeycloakConfig()).toThrow(KeycloakConfigError);
    expect(() => loadKeycloakConfig()).toThrow('KEYCLOAK_ISSUER');
  });

  it('throws when KEYCLOAK_AUDIENCE is missing', async () => {
    setValidEnv();
    delete process.env.KEYCLOAK_AUDIENCE;

    const { loadKeycloakConfig, KeycloakConfigError } = await loadKeycloakConfigModule();

    expect(() => loadKeycloakConfig()).toThrow(KeycloakConfigError);
    expect(() => loadKeycloakConfig()).toThrow('KEYCLOAK_AUDIENCE');
  });

  it('does not expose configuration values in error messages', async () => {
    setValidEnv();
    delete process.env.KEYCLOAK_AUDIENCE;

    const { loadKeycloakConfig } = await loadKeycloakConfigModule();

    expect(() => loadKeycloakConfig()).toThrowError(/KEYCLOAK_AUDIENCE/);
    expect(() => loadKeycloakConfig()).not.toThrowError(/nutria-api/);
  });
});
