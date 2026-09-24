import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

const mocks = vi.hoisted(() => ({
  createPool: vi.fn(),
}));

vi.mock('oracledb', () => ({
  __esModule: true,
  default: {
    createPool: mocks.createPool,
  },
}));

function setValidEnv(): void {
  process.env.ORACLE_USER = 'system';
  process.env.ORACLE_PASSWORD = 'secret';
  process.env.ORACLE_HOST = 'localhost';
  process.env.ORACLE_PORT = '1521';
  process.env.ORACLE_SERVICE = 'FREEPDB1';
}

function createFakePool(): {
  getConnection: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
} {
  return {
    getConnection: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

async function loadPoolModule() {
  vi.resetModules();
  const poolModule = await import('../src/infrastructure/database/oracle/oracle.pool');
  const errorsModule = await import('../src/infrastructure/database/oracle/oracle.errors');
  return {
    ...poolModule,
    OraclePoolNotInitializedError: errorsModule.OraclePoolNotInitializedError,
    OracleConnectionError: errorsModule.OracleConnectionError,
  };
}

beforeEach(() => {
  setValidEnv();
  mocks.createPool.mockReset();
});

afterEach(() => {
  for (const name of ORACLE_ENV_VARS) {
    delete process.env[name];
  }
  vi.resetModules();
});

describe('oracle.pool', () => {
  it('initializes a single pool using the environment configuration', async () => {
    const fakePool = createFakePool();
    mocks.createPool.mockResolvedValue(fakePool);

    const { initializePool, getPool, isPoolInitialized } = await loadPoolModule();

    await initializePool();

    expect(mocks.createPool).toHaveBeenCalledTimes(1);
    expect(mocks.createPool).toHaveBeenCalledWith({
      user: 'system',
      password: 'secret',
      connectString: 'localhost:1521/FREEPDB1',
      poolMin: 0,
      poolMax: 10,
      poolIncrement: 1,
    });
    expect(isPoolInitialized()).toBe(true);
    await expect(getPool()).resolves.toBe(fakePool);
  });

  it('does not create a second pool when initialization is requested twice', async () => {
    mocks.createPool.mockResolvedValue(createFakePool());

    const { initializePool } = await loadPoolModule();

    await initializePool();
    await initializePool();

    expect(mocks.createPool).toHaveBeenCalledTimes(1);
  });

  it('returns the same pool for concurrent initialization calls', async () => {
    mocks.createPool.mockResolvedValue(createFakePool());

    const { initializePool } = await loadPoolModule();

    const [first, second] = await Promise.all([initializePool(), initializePool()]);

    expect(first).toBe(second);
    expect(mocks.createPool).toHaveBeenCalledTimes(1);
  });

  it('throws a clear error when the pool is requested before initialization', async () => {
    const { getPool, OraclePoolNotInitializedError } = await loadPoolModule();

    expect(() => getPool()).toThrow(OraclePoolNotInitializedError);
    expect(() => getPool()).toThrow('not initialized');
  });

  it('closes the pool and resets the initialization state', async () => {
    const fakePool = createFakePool();
    mocks.createPool.mockResolvedValue(fakePool);

    const { initializePool, closePool, getPool, isPoolInitialized, OraclePoolNotInitializedError } =
      await loadPoolModule();

    await initializePool();
    await closePool();

    expect(fakePool.close).toHaveBeenCalledTimes(1);
    expect(isPoolInitialized()).toBe(false);
    expect(() => getPool()).toThrow(OraclePoolNotInitializedError);
  });

  it('is a no-op when closing before initialization', async () => {
    const { closePool, getPool, OraclePoolNotInitializedError } = await loadPoolModule();

    await expect(closePool()).resolves.toBeUndefined();
    expect(() => getPool()).toThrow(OraclePoolNotInitializedError);
  });

  it('propagates initialization errors without hiding them and allows a retry', async () => {
    const listenerError = Object.assign(new Error('ORA-12541: TNS:no listener'), { errorNum: 12541 });
    mocks.createPool.mockRejectedValueOnce(listenerError);
    mocks.createPool.mockResolvedValueOnce(createFakePool());

    const { initializePool, isPoolInitialized, OracleConnectionError } = await loadPoolModule();

    const rejected = initializePool();

    await expect(rejected).rejects.toBeInstanceOf(OracleConnectionError);
    await expect(rejected).rejects.toThrow('ORA-12541');
    expect(isPoolInitialized()).toBe(false);

    await expect(initializePool()).resolves.toBeDefined();
    expect(mocks.createPool).toHaveBeenCalledTimes(2);
  });

  it('does not initialize a pool when required environment variables are missing', async () => {
    delete process.env.ORACLE_PASSWORD;

    const { initializePool, isPoolInitialized } = await loadPoolModule();

    expect(() => initializePool()).toThrow('ORACLE_PASSWORD');
    expect(mocks.createPool).not.toHaveBeenCalled();
    expect(isPoolInitialized()).toBe(false);
  });
});