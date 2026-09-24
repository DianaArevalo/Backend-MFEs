/**
 * Configuración de acceso a Oracle.
 *
 * Responsabilidad:
 * - Leer la configuración desde variables de entorno (reutilizando la
 *   estrategia centralizada de shared/config/config.ts).
 * - Validar que las variables obligatorias existan.
 * - Construir el connectString y la configuración del pool para
 *   node-oracledb.
 *
 * No crea conexiones ni pool.
 */

import { config } from '../../../shared/config/config';

export interface OracleConfig {
  user: string;
  password: string;
  connectString: string;
  poolMin: number;
  poolMax: number;
  poolIncrement: number;
}

const DEFAULT_POOL_MIN = 0;
const DEFAULT_POOL_MAX = 10;
const DEFAULT_POOL_INCREMENT = 1;

export class OracleConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OracleConfigError';
  }
}

function requireEnv(value: string | undefined, name: string): string {
  if (value === undefined || value.trim() === '') {
    throw new OracleConfigError(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function readNonNegativeInt(value: string | undefined, name: string, fallback: number): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new OracleConfigError(`Invalid environment variable ${name}; expected a non-negative integer, got "${value}"`);
  }
  return parsed;
}

export function loadOracleConfig(): OracleConfig {
  const user = requireEnv(config.oracle.user, 'ORACLE_USER');
  const password = requireEnv(config.oracle.password, 'ORACLE_PASSWORD');
  const host = requireEnv(config.oracle.host, 'ORACLE_HOST');
  const port = requireEnv(config.oracle.port, 'ORACLE_PORT');
  const service = requireEnv(config.oracle.service, 'ORACLE_SERVICE');

  if (!/^\d+$/.test(port)) {
    throw new OracleConfigError(`Invalid environment variable ORACLE_PORT; expected a numeric port, got "${port}"`);
  }

  const poolMin = readNonNegativeInt(config.oracle.pool.min, 'ORACLE_POOL_MIN', DEFAULT_POOL_MIN);
  const poolMax = readNonNegativeInt(config.oracle.pool.max, 'ORACLE_POOL_MAX', DEFAULT_POOL_MAX);
  const poolIncrement = readNonNegativeInt(config.oracle.pool.increment, 'ORACLE_POOL_INCREMENT', DEFAULT_POOL_INCREMENT);

  if (poolMax <= 0) {
    throw new OracleConfigError('ORACLE_POOL_MAX must be greater than zero');
  }
  if (poolMin > poolMax) {
    throw new OracleConfigError('ORACLE_POOL_MIN cannot be greater than ORACLE_POOL_MAX');
  }
  if (poolIncrement === 0) {
    throw new OracleConfigError('ORACLE_POOL_INCREMENT cannot be zero');
  }

  return {
    user,
    password,
    connectString: `${host}:${port}/${service}`,
    poolMin,
    poolMax,
    poolIncrement,
  };
}