import { afterEach, describe, expect, it, vi } from 'vitest';

const ORACLE_ENV_VARS = [
  'ORACLE_USER',
  'ORACLE_PASSWORD',
  'ORACLE_HOST',
  'ORACLE_PORT',
  'ORACLE_SERVICE',
  'ORACLE_SERVICE_NAME',
  'ORACLE_POOL_MIN',
  'ORACLE_POOL_MAX',
  'ORACLE_POOL_INCREMENT',
] as const;

function setValidEnv(): void {
  process.env.ORACLE_USER = 'system';
  process.env.ORACLE_PASSWORD = 'secret';
  process.env.ORACLE_HOST = 'localhost';
  process.env.ORACLE_PORT = '1521';
  process.env.ORACLE_SERVICE = 'FREEPDB1';
}

async function loadOracleConfigModule() {
  vi.resetModules();
  return import('../src/infrastructure/database/oracle/oracle.config');
}

afterEach(() => {
  for (const name of ORACLE_ENV_VARS) {
    delete process.env[name];
  }
  vi.resetModules();
});

describe('oracle.config', () => {
  it('builds the connectString and default pool settings from environment variables', async () => {
    setValidEnv();

    const { loadOracleConfig } = await loadOracleConfigModule();
    const oracleConfig = loadOracleConfig();

    expect(oracleConfig.user).toBe('system');
    expect(oracleConfig.password).toBe('secret');
    expect(oracleConfig.connectString).toBe('localhost:1521/FREEPDB1');
    expect(oracleConfig.poolMin).toBe(0);
    expect(oracleConfig.poolMax).toBe(10);
    expect(oracleConfig.poolIncrement).toBe(1);
  });

  it('supports ORACLE_SERVICE_NAME as a fallback for ORACLE_SERVICE', async () => {
    setValidEnv();
    delete process.env.ORACLE_SERVICE;
    process.env.ORACLE_SERVICE_NAME = 'XEPDB1';

    const { loadOracleConfig } = await loadOracleConfigModule();

    expect(loadOracleConfig().connectString).toBe('localhost:1521/XEPDB1');
  });

  it('uses ORACLE_POOL_* overrides when provided', async () => {
    setValidEnv();
    process.env.ORACLE_POOL_MIN = '2';
    process.env.ORACLE_POOL_MAX = '20';
    process.env.ORACLE_POOL_INCREMENT = '5';

    const { loadOracleConfig } = await loadOracleConfigModule();
    const oracleConfig = loadOracleConfig();

    expect(oracleConfig.poolMin).toBe(2);
    expect(oracleConfig.poolMax).toBe(20);
    expect(oracleConfig.poolIncrement).toBe(5);
  });

  it('throws when ORACLE_USER is missing', async () => {
    setValidEnv();
    delete process.env.ORACLE_USER;

    const { loadOracleConfig, OracleConfigError } = await loadOracleConfigModule();

    expect(() => loadOracleConfig()).toThrow(OracleConfigError);
    expect(() => loadOracleConfig()).toThrow('ORACLE_USER');
  });

  it('throws when ORACLE_PASSWORD is missing', async () => {
    setValidEnv();
    delete process.env.ORACLE_PASSWORD;

    const { loadOracleConfig, OracleConfigError } = await loadOracleConfigModule();

    expect(() => loadOracleConfig()).toThrow(OracleConfigError);
    expect(() => loadOracleConfig()).toThrow('ORACLE_PASSWORD');
  });

  it('throws when ORACLE_HOST is missing', async () => {
    setValidEnv();
    delete process.env.ORACLE_HOST;

    const { loadOracleConfig, OracleConfigError } = await loadOracleConfigModule();

    expect(() => loadOracleConfig()).toThrow(OracleConfigError);
  });

  it('throws when ORACLE_PORT is missing', async () => {
    setValidEnv();
    delete process.env.ORACLE_PORT;

    const { loadOracleConfig, OracleConfigError } = await loadOracleConfigModule();

    expect(() => loadOracleConfig()).toThrow(OracleConfigError);
  });

  it('throws when ORACLE_SERVICE is missing', async () => {
    setValidEnv();
    delete process.env.ORACLE_SERVICE;
    delete process.env.ORACLE_SERVICE_NAME;

    const { loadOracleConfig, OracleConfigError } = await loadOracleConfigModule();

    expect(() => loadOracleConfig()).toThrow(OracleConfigError);
    expect(() => loadOracleConfig()).toThrow('ORACLE_SERVICE');
  });

  it('throws when ORACLE_PORT is not numeric', async () => {
    setValidEnv();
    process.env.ORACLE_PORT = 'not-a-port';

    const { loadOracleConfig, OracleConfigError } = await loadOracleConfigModule();

    expect(() => loadOracleConfig()).toThrow(OracleConfigError);
    expect(() => loadOracleConfig()).toThrow('ORACLE_PORT');
  });

  it('throws when ORACLE_POOL_MIN is greater than ORACLE_POOL_MAX', async () => {
    setValidEnv();
    process.env.ORACLE_POOL_MIN = '10';
    process.env.ORACLE_POOL_MAX = '2';

    const { loadOracleConfig, OracleConfigError } = await loadOracleConfigModule();

    expect(() => loadOracleConfig()).toThrow(OracleConfigError);
  });

  it('throws when ORACLE_POOL_MAX is not a valid positive value', async () => {
    setValidEnv();
    process.env.ORACLE_POOL_MAX = '0';

    const { loadOracleConfig, OracleConfigError } = await loadOracleConfigModule();

    expect(() => loadOracleConfig()).toThrow(OracleConfigError);
  });

  it('does not include credentials in error messages', async () => {
    setValidEnv();
    process.env.ORACLE_POOL_MAX = 'not-a-number';

    const { loadOracleConfig } = await loadOracleConfigModule();

    expect(() => loadOracleConfig()).toThrowError(/ORACLE_POOL_MAX/);
    expect(() => loadOracleConfig()).not.toThrowError(/secret/);
  });
});