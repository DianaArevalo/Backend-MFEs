/**
 * Repository responsable de la actualización de accesos.
 *
 * PL/SQL:
 * - PKG_SEGURIDAD.SP_UPDATE_ACCESO
 *
 * Responsabilidad:
 * - Ejecutar el procedimiento de actualización de un acceso.
 * - Enviar a PL/SQL el identificador y los datos que deben modificarse.
 *
 * Nota:
 * - Las reglas de negocio corresponden a PKG_SEGURIDAD.
 * - Este repository se encarga únicamente de la comunicación con Oracle.
 */

import { OracleClient } from '../../../../infrastructure/database/oracle/oracle.client';

export class AccessUpdateRepository {
  constructor(private readonly oracleClient: OracleClient) {}

  async updateAccess(accessId: string, data: any): Promise<any> {
    const result = await this.oracleClient.execute(
      "BEGIN PKG_SEGURIDAD.SP_UPDATE_ACCESO(:accessId, :data); END;",
      {
        accessId,
        data
      }
    );
    return result;
  }
}