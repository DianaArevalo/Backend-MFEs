/**
 * Repository responsable del cambio de estado de los accesos.
 *
 * PL/SQL:
 * - PKG_SEGURIDAD.SP_ENABLE_ACCESO
 * - PKG_SEGURIDAD.SP_DISABLE_ACCESO
 *
 * Responsabilidad:
 * - Activar un acceso.
 * - Deshabilitar un acceso.
 * - Ejecutar el procedimiento PL/SQL correspondiente según la operación.
 *
 * Nota:
 * - Las validaciones de estado corresponden a PKG_SEGURIDAD.
 * - No duplicar reglas de negocio en este repository.
 */


import { OracleClient } from '../../../../infrastructure/database/oracle/oracle.client';

export class AccessStatusRepository {
  constructor(private readonly oracleClient: OracleClient) {}

  async enableAccess(accessId: string): Promise<any> {
    const result = await this.oracleClient.execute(
      "BEGIN PKG_SEGURIDAD.SP_ENABLE_ACCESO(:accessId); END;",
      {
        accessId
      }
    );
    return result;
  }

  async disableAccess(accessId: string): Promise<any> {
    const result = await this.oracleClient.execute(
      "BEGIN PKG_SEGURIDAD.SP_DISABLE_ACCESO(:accessId); END;",
      {
        accessId
      }
    );
    return result;
  }
}