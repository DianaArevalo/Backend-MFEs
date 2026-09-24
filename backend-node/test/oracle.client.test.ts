import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DefaultOracleClient } from '../src/infrastructure/database/oracle/oracle.client';
import {
  OracleBusinessError,
  OracleConnectionError,
  OraclePoolNotInitializedError,
} from '../src/infrastructure/database/oracle/oracle.errors';

const mocks = vi.hoisted(() => ({
  getPool: vi.fn(),
}));

vi.mock('../src/infrastructure/database/oracle/oracle.pool', () => ({
  getPool: mocks.getPool,
}));

type FakeConnection = {
  execute: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
};

function createFakeConnection(): FakeConnection {
  return {
    execute: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

function createFakePool(connection: FakeConnection): { getConnection: ReturnType<typeof vi.fn> } {
  return {
    getConnection: vi.fn().mockResolvedValue(connection),
  };
}

beforeEach(() => {
  mocks.getPool.mockReset();
});

describe('oracle.client', () => {
  it('executes SQL statements with binds and returns the result, releasing the connection', async () => {
    const connection = createFakeConnection();
    connection.execute.mockResolvedValue({ rows: [], rowsAffected: 1 });
    mocks.getPool.mockResolvedValue(createFakePool(connection));

    const client = new DefaultOracleClient();

    const sql = 'SELECT id FROM acceso WHERE id = :id';
    const binds = { id: 42 };
    const result = await client.execute(sql, binds);

    expect(mocks.getPool).toHaveBeenCalledTimes(1);
    expect(connection.execute).toHaveBeenCalledWith(sql, binds);
    expect(connection.close).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ rows: [], rowsAffected: 1 });
  });

  it('executes PL/SQL blocks with IN/OUT binds and options', async () => {
    const connection = createFakeConnection();
    connection.execute.mockResolvedValue({ outBinds: { P_ACCESO_ID: 99 } });
    mocks.getPool.mockResolvedValue(createFakePool(connection));

    const client = new DefaultOracleClient();

    const sql = 'BEGIN PKG_SEGURIDAD.SP_ADD_ACCESO(:P_NOMBRE_USUARIO); END;';
    const binds = {
      P_NOMBRE_USUARIO: 'juan',
      P_ACCESO_ID: { dir: 4003, type: 2010 },
    };
    const options = { outFormat: 4002 };

    const result = await client.execute(sql, binds, options);

    expect(connection.execute).toHaveBeenCalledWith(sql, binds, options);
    expect(result.outBinds).toEqual({ P_ACCESO_ID: 99 });
    expect(connection.close).toHaveBeenCalledTimes(1);
  });

  it('uses an empty bind object when no binds are provided', async () => {
    const connection = createFakeConnection();
    connection.execute.mockResolvedValue({ rows: [] });
    mocks.getPool.mockResolvedValue(createFakePool(connection));

    const client = new DefaultOracleClient();

    await client.execute('SELECT 1 FROM dual');

    expect(connection.execute).toHaveBeenCalledWith('SELECT 1 FROM dual', {});
    expect(connection.close).toHaveBeenCalledTimes(1);
  });

  it('translates Oracle errors raised during execution and still releases the connection', async () => {
    const connection = createFakeConnection();
    const dbError = Object.assign(new Error('ORA-20001: usuario duplicado'), { errorNum: 20001 });
    connection.execute.mockRejectedValue(dbError);
    mocks.getPool.mockResolvedValue(createFakePool(connection));

    const client = new DefaultOracleClient();

    const translated = await client
      .execute('BEGIN PKG_SEGURIDAD.SP_ADD_ACCESO(:x); END;', { x: 1 })
      .catch((error: unknown) => error);

    expect(translated).toBeInstanceOf(OracleBusinessError);
    expect((translated as Error).message).toBe('ORA-20001: usuario duplicado');
    expect((translated as OracleBusinessError).errorNum).toBe(20001);
    expect((translated as OracleBusinessError).cause).toBe(dbError);
    expect(connection.close).toHaveBeenCalledTimes(1);
  });

  it('does not wrap non-Oracle errors and still releases the connection', async () => {
    const connection = createFakeConnection();
    const plainError = new Error('boom');
    connection.execute.mockRejectedValue(plainError);
    mocks.getPool.mockResolvedValue(createFakePool(connection));

    const client = new DefaultOracleClient();

    await expect(client.execute('whatever', {})).rejects.toBe(plainError);
    expect(connection.close).toHaveBeenCalledTimes(1);
  });

  it('propagates pool-not-initialized errors', async () => {
    mocks.getPool.mockRejectedValue(new OraclePoolNotInitializedError());

    const client = new DefaultOracleClient();

    await expect(client.execute('SELECT 1 FROM dual')).rejects.toBeInstanceOf(OraclePoolNotInitializedError);
  });

  it('translates errors raised while acquiring a connection from the pool', async () => {
    const listenerError = Object.assign(new Error('ORA-12541: TNS:no listener'), { errorNum: 12541 });
    mocks.getPool.mockResolvedValue({
      getConnection: vi.fn().mockRejectedValue(listenerError),
    });

    const client = new DefaultOracleClient();

    await expect(client.execute('SELECT 1 FROM dual')).rejects.toBeInstanceOf(OracleConnectionError);
    await expect(client.execute('SELECT 1 FROM dual')).rejects.toThrow('ORA-12541');
  });

  it('releases the connection even when closing the connection fails', async () => {
    const connection = createFakeConnection();
    connection.execute.mockResolvedValue({ rows: [] });
    connection.close.mockRejectedValue(new Error('close failed'));
    mocks.getPool.mockResolvedValue(createFakePool(connection));

    const client = new DefaultOracleClient();

    await expect(client.execute('SELECT 1 FROM dual')).rejects.toThrow('close failed');
    expect(connection.close).toHaveBeenCalledTimes(1);
  });
});