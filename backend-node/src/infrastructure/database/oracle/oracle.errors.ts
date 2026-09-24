/**
 * Tratamiento de errores de node-oracledb.
 *
 * Responsabilidad:
 * - Centralizar la clasificación de errores provenientes de Oracle.
 * - Conservar la información original (errorNum, offset, code, message)
 *   para logging técnico.
 * - Permitir distinguir errores de conectividad, ejecución,
 *   RAISE_APPLICATION_ERROR, constraints y desconocidos.
 *
 * No convierte los errores Oracle en mensajes genéricos.
 * No incluye credenciales ni información sensible en los mensajes.
 */

export interface OracleErrorOptions {
  errorNum?: number;
  offset?: number;
  code?: string;
  cause?: unknown;
}

export class OracleError extends Error {
  public readonly errorNum?: number;
  public readonly offset?: number;
  public readonly code?: string;
  public readonly cause?: unknown;

  constructor(message: string, options: OracleErrorOptions = {}) {
    super(message);
    this.name = 'OracleError';
    this.errorNum = options.errorNum;
    this.offset = options.offset;
    this.code = options.code;
    this.cause = options.cause;
  }
}

export class OracleConnectionError extends OracleError {
  constructor(message: string, options: OracleErrorOptions = {}) {
    super(message, options);
    this.name = 'OracleConnectionError';
  }
}

export class OracleExecutionError extends OracleError {
  constructor(message: string, options: OracleErrorOptions = {}) {
    super(message, options);
    this.name = 'OracleExecutionError';
  }
}

export class OracleBusinessError extends OracleError {
  constructor(message: string, options: OracleErrorOptions = {}) {
    super(message, options);
    this.name = 'OracleBusinessError';
  }
}

export class OracleConstraintError extends OracleError {
  constructor(message: string, options: OracleErrorOptions = {}) {
    super(message, options);
    this.name = 'OracleConstraintError';
  }
}

export class OraclePoolNotInitializedError extends Error {
  constructor(message = 'Oracle connection pool is not initialized. Call initializePool() before using the pool.') {
    super(message);
    this.name = 'OraclePoolNotInitializedError';
  }
}

export interface OracleDbErrorLike {
  code?: string;
  errorNum?: number;
  offset?: number;
  message: string;
}

const ORACLE_ERROR_CODE_PATTERN = /^(ORA|NJS|DPI)-\d{3,5}$/;

function isOracleDbError(error: unknown): error is OracleDbErrorLike {
  if (!(error instanceof Error)) {
    return false;
  }
  const candidate = error as OracleDbErrorLike;
  if (typeof candidate.errorNum === 'number') {
    return true;
  }
  return typeof candidate.code === 'string' && ORACLE_ERROR_CODE_PATTERN.test(candidate.code);
}

const RAISE_APPLICATION_ERROR_MIN = 20000;
const RAISE_APPLICATION_ERROR_MAX = 20999;

const CONSTRAINT_ERROR_NUMS = new Set<number>([1, 1400, 1401, 2290, 2291, 2292, 2298]);

const CONNECTION_ERROR_NUMS = new Set<number>([1017, 12154, 12224, 12514, 12541, 12560, 12571, 12638, 12640, 12646]);

const CONNECTION_ERROR_CODES = new Set<string>(['NJS-016']);

function isConnectionError(error: OracleDbErrorLike): boolean {
  if (error.errorNum !== undefined && CONNECTION_ERROR_NUMS.has(error.errorNum)) {
    return true;
  }
  return typeof error.code === 'string' && CONNECTION_ERROR_CODES.has(error.code);
}

function buildOracleError(error: OracleDbErrorLike): OracleError {
  const { errorNum, offset, code, message } = error;
  const cause = error instanceof Error ? error : undefined;

  if (errorNum !== undefined && errorNum >= RAISE_APPLICATION_ERROR_MIN && errorNum <= RAISE_APPLICATION_ERROR_MAX) {
    return new OracleBusinessError(message, { errorNum, offset, code, cause });
  }

  if (errorNum !== undefined && CONSTRAINT_ERROR_NUMS.has(errorNum)) {
    return new OracleConstraintError(message, { errorNum, offset, code, cause });
  }

  if (isConnectionError(error)) {
    return new OracleConnectionError(message, { errorNum, offset, code, cause });
  }

  if (errorNum !== undefined) {
    return new OracleExecutionError(message, { errorNum, offset, code, cause });
  }

  return new OracleError(message, { errorNum, offset, code, cause });
}

export function translateOracleError(error: unknown): unknown {
  if (error instanceof OracleError) {
    return error;
  }
  if (!isOracleDbError(error)) {
    return error;
  }
  return buildOracleError(error);
}

export function isOracleError(error: unknown): error is OracleError {
  return error instanceof OracleError;
}

export function isOracleConnectionError(error: unknown): error is OracleConnectionError {
  return error instanceof OracleConnectionError;
}

export function isOracleExecutionError(error: unknown): error is OracleExecutionError {
  return error instanceof OracleExecutionError;
}

export function isOracleBusinessError(error: unknown): error is OracleBusinessError {
  return error instanceof OracleBusinessError;
}

export function isOracleConstraintError(error: unknown): error is OracleConstraintError {
  return error instanceof OracleConstraintError;
}