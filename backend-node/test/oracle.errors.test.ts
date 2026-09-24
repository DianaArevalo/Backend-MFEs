import { describe, expect, it } from 'vitest';
import {
  OracleBusinessError,
  OracleConnectionError,
  OracleConstraintError,
  OracleError,
  OracleExecutionError,
  isOracleBusinessError,
  isOracleConnectionError,
  isOracleConstraintError,
  isOracleExecutionError,
  translateOracleError,
} from '../src/infrastructure/database/oracle/oracle.errors';

interface OracleErrorLike {
  message: string;
  errorNum?: number;
  offset?: number;
  code?: string;
}

function createDbError(partial: OracleErrorLike): Error {
  const error = new Error(partial.message);
  if (partial.errorNum !== undefined) {
    Object.assign(error, { errorNum: partial.errorNum });
  }
  if (partial.offset !== undefined) {
    Object.assign(error, { offset: partial.offset });
  }
  if (partial.code !== undefined) {
    Object.assign(error, { code: partial.code });
  }
  return error;
}

describe('translateOracleError', () => {
  it('classifies RAISE_APPLICATION_ERROR as a business error preserving the ORA message', () => {
    const error = createDbError({ message: 'ORA-20001: Usuario duplicado', errorNum: 20001 });

    const translated = translateOracleError(error);

    expect(translated).toBeInstanceOf(OracleBusinessError);
    expect(isOracleBusinessError(translated)).toBe(true);
    expect(translated).toHaveProperty('errorNum', 20001);
    expect((translated as Error).message).toBe('ORA-20001: Usuario duplicado');
  });

  it('classifies ORA-00001 as a constraint error', () => {
    const error = createDbError({ message: 'ORA-00001: unique constraint violated', errorNum: 1 });

    const translated = translateOracleError(error);

    expect(translated).toBeInstanceOf(OracleConstraintError);
    expect(isOracleConstraintError(translated)).toBe(true);
    expect(translated).toHaveProperty('errorNum', 1);
  });

  it('classifies ORA-02291 as a constraint error', () => {
    const error = createDbError({ message: 'ORA-02291: integrity constraint violated', errorNum: 2291 });

    expect(translateOracleError(error)).toBeInstanceOf(OracleConstraintError);
  });

  it('classifies TNS network errors as connection errors', () => {
    const error = createDbError({ message: 'ORA-12541: TNS:no listener', errorNum: 12541 });

    const translated = translateOracleError(error);

    expect(translated).toBeInstanceOf(OracleConnectionError);
    expect(isOracleConnectionError(translated)).toBe(true);
  });

  it('classifies invalid credentials as a connection error', () => {
    const error = createDbError({ message: 'ORA-01017: invalid username/password', errorNum: 1017 });

    expect(translateOracleError(error)).toBeInstanceOf(OracleConnectionError);
  });

  it('classifies remaining ORA execution errors as execution errors', () => {
    const error = createDbError({ message: 'ORA-06550: line 1, column 7', errorNum: 6550, offset: 7 });

    const translated = translateOracleError(error);

    expect(translated).toBeInstanceOf(OracleExecutionError);
    expect(isOracleExecutionError(translated)).toBe(true);
    expect(translated).toHaveProperty('offset', 7);
  });

  it('classifies driver errors without errorNum as unclassified Oracle errors preserving code', () => {
    const error = createDbError({ message: 'NJS-999: unexpected driver error', code: 'NJS-999' });

    const translated = translateOracleError(error);

    expect(translated).toBeInstanceOf(OracleError);
    expect(translated).toHaveProperty('code', 'NJS-999');
  });

  it('classifies NJS-016 as a connection error', () => {
    const error = createDbError({ message: 'NJS-016: cannot acquire a connection', code: 'NJS-016' });

    expect(translateOracleError(error)).toBeInstanceOf(OracleConnectionError);
  });

  it('preserves the original error as cause', () => {
    const error = createDbError({ message: 'ORA-20002: something failed', errorNum: 20002 });

    const translated = translateOracleError(error) as OracleError;

    expect(translated.cause).toBe(error);
  });

  it('passes through non-Oracle errors unchanged', () => {
    const error = new Error('boom');

    expect(translateOracleError(error)).toBe(error);
  });

  it('passes through null and undefined values unchanged', () => {
    expect(translateOracleError(null)).toBeNull();
    expect(translateOracleError(undefined)).toBeUndefined();
  });

  it('returns OracleError instances without re-wrapping them', () => {
    const oracleError = new OracleExecutionError('ORA-06550', { errorNum: 6550 });

    expect(translateOracleError(oracleError)).toBe(oracleError);
  });

  it('keeps errorNum and code when building the error hierarchy', () => {
    const error = createDbError({ message: 'ORA-20003: app error', errorNum: 20003 });

    const translated = translateOracleError(error) as OracleError;

    expect(translated.name).toBe('OracleBusinessError');
    expect(translated.errorNum).toBe(20003);
    expect(translated.message).toBe('ORA-20003: app error');
  });
});