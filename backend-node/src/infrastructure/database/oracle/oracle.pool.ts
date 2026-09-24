/**
 * Administración del pool de conexiones Oracle.
 *
 * Responsabilidad:
 * - Crear y administrar una única instancia de pool por proceso.
 * - Exponer funciones de inicialización, obtención y cierre del pool.
 * - No ocultar errores de inicialización.
 *
 * Usa la configuración construida por oracle.config.ts.
 */

import oracledb from 'oracledb';
import { loadOracleConfig } from './oracle.config';
import { OraclePoolNotInitializedError, translateOracleError } from './oracle.errors';

let poolPromise: Promise<oracledb.Pool> | null = null;

export function initializePool(): Promise<oracledb.Pool> {
  if (poolPromise !== null) {
    return poolPromise;
  }

  const oracleConfig = loadOracleConfig();

  poolPromise = oracledb
    .createPool({
      user: oracleConfig.user,
      password: oracleConfig.password,
      connectString: oracleConfig.connectString,
      poolMin: oracleConfig.poolMin,
      poolMax: oracleConfig.poolMax,
      poolIncrement: oracleConfig.poolIncrement,
    })
    .catch((error: unknown) => {
      poolPromise = null;
      throw translateOracleError(error);
    });

  return poolPromise;
}

export function getPool(): Promise<oracledb.Pool> {
  if (poolPromise === null) {
    throw new OraclePoolNotInitializedError();
  }
  return poolPromise;
}

export async function closePool(): Promise<void> {
  const active = poolPromise;
  if (active === null) {
    return;
  }
  poolPromise = null;

  try {
    await (await active).close();
  } catch (error: unknown) {
    throw translateOracleError(error);
  }
}

export function isPoolInitialized(): boolean {
  return poolPromise !== null;
}