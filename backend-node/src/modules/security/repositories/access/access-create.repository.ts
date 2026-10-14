/**
 * Repository responsable de la creación de accesos.
 *
 * PL/SQL:
 * - PKG_SEGURIDAD.SP_ADD_ACCESO
 *
 * Responsabilidad:
 * - Ejecutar el procedimiento de creación de un acceso.
 * - Recibir los datos necesarios para registrar el acceso.
 * - Obtener el identificador generado por PL/SQL cuando corresponda.
 *
 * Nota:
 * - La lógica de negocio y sus validaciones corresponden a PKG_SEGURIDAD.
 * - Este repository se encarga únicamente de la comunicación con Oracle.
 */

import { OracleClient } from "../../../../infrastructure/database/oracle/oracle.client";
import oracledb from "oracledb";

export interface CreateAccessRepositoryData {
  keycloak_user_id: string;
  rol_id: number;
  afiliado_id?: number;
  empresa_id?: number;
}

export class AccessCreateRepository {
  constructor(private readonly oracleClient: OracleClient) {}

  async createAccess(data: CreateAccessRepositoryData): Promise<number> {
    const result = await this.oracleClient.execute<{
      P_ACCESO_ID: number;
    }>(
      `
    BEGIN
      PKG_SEGURIDAD.SP_ADD_ACCESO(
        :P_KEYCLOAK_USER_ID,
        :P_ROL_ID,
        :P_AFILIADO_ID,
        :P_EMPRESA_ID,
        :P_ACCESO_ID
      );
    END;
  `,
      {
        P_KEYCLOAK_USER_ID: data.keycloak_user_id,
        P_ROL_ID: data.rol_id,
        P_AFILIADO_ID: data.afiliado_id ?? null,
        P_EMPRESA_ID: data.empresa_id ?? null,
        P_ACCESO_ID: {
          dir: oracledb.BIND_OUT,
          type: oracledb.NUMBER,
        },
      },
      {
        autoCommit: true,
      },
    );

    return result.outBinds?.P_ACCESO_ID as number;
  }
}
