/**
 * Cliente Oracle, punto de acceso de los repositories a Oracle.
 *
 * Responsabilidad:
 * - Obtener una conexión desde el pool.
 * - Ejecutar SQL o bloques PL/SQL con binds nombrados
 *   (IN, OUT e IN OUT de node-oracledb).
 * - Liberar siempre la conexión, incluso cuando ocurre una excepción.
 * - No contiene lógica de negocio ni conoce paquetes específicos.
 */

import type oracledb from 'oracledb';
import { getPool } from './oracle.pool';
import { translateOracleError } from './oracle.errors';

export interface OracleClient {
  execute<T = unknown>(
    sql: string,
    binds?: oracledb.BindParameters,
    options?: oracledb.ExecuteOptions,
  ): Promise<oracledb.Result<T>>;
}

export class DefaultOracleClient implements OracleClient {
  async execute<T = unknown>(
    sql: string,
    binds?: oracledb.BindParameters,
    options?: oracledb.ExecuteOptions,
  ): Promise<oracledb.Result<T>> {
    const pool = await getPool();

    const connection = await pool.getConnection().catch((error: unknown) => {
      throw translateOracleError(error);
    });

    const executeBinds: oracledb.BindParameters = binds ?? {};
    let primaryError: unknown;

    try {
      if (options === undefined) {
        return await connection.execute<T>(sql, executeBinds);
      }
      return await connection.execute<T>(sql, executeBinds, options);
    } catch (error: unknown) {
      primaryError = translateOracleError(error);
      throw primaryError;
    } finally {
      try {
        await connection.close();
      } catch (closeError: unknown) {
        if (primaryError === undefined) {
          throw translateOracleError(closeError);
        }
      }
    }
  }
}