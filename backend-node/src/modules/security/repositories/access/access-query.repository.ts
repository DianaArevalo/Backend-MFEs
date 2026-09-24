/**
 * Repository responsable de las consultas relacionadas con accesos y roles.
 *
 * PL/SQL:
 * - PKG_SEGURIDAD.SP_GET_ACCESOS_ROL
 * - PKG_SEGURIDAD.FN_TIENE_ROL
 * - PKG_SEGURIDAD.FN_ROL_ACCESO
 *
 * Responsabilidad:
 * - Obtener los accesos asociados a un rol.
 * - Determinar si un acceso posee un rol específico.
 * - Obtener el rol asociado a un acceso.
 *
 * Nota:
 * - Las consultas y reglas definidas por PKG_SEGURIDAD deben respetarse.
 * - Este repository se encarga de ejecutar SPs/funciones y transformar
 *   el resultado de Oracle cuando sea necesario.
 */

import { OracleClient } from '../../../../infrastructure/database/oracle/oracle.client';

export class AccessQueryRepository {
  constructor(private readonly oracleClient: OracleClient) {}

  async getAccessesByRole(roleId: string): Promise<any> {
    const result = await this.oracleClient.execute(
      "BEGIN PKG_SEGURIDAD.SP_GET_ACCESOS_ROL(:roleId); END;",
      {
        roleId
      }
    );
    return result;
  }

  async hasRole(accessId: string, roleId: string): Promise<boolean> {
    const result = await this.oracleClient.execute(
      "BEGIN PKG_SEGURIDAD.FN_TIENE_ROL(:accessId, :roleId); END;",
      {
        accessId,
        roleId
      }
    );
    return result as unknown as boolean;
  }

  async getRoleByAccess(accessId: string): Promise<any> {
    const result = await this.oracleClient.execute(
      "BEGIN PKG_SEGURIDAD.FN_ROL_ACCESO(:accessId); END;",
      {
        accessId
      }
    );
    return result;
  }
}