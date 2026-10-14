/**
 * Repository de autorización de accesos basada en la identidad de Keycloak.
 *
 * Responsabilidad:
 * - Resolver el ACCESO asociado a un `KEYCLOAK_USER_ID` (`sub` del token).
 * - Determinar si el ROL de un ACCESO posee un PERMISO concreto a través de
 *   la relación ACCESO → ROL → ROL_PERMISO → PERMISO.
 *
 * Nota:
 * - Oracle conserva la responsabilidad de determinar roles y permisos. Estas
 *   consultas son de solo lectura sobre las tablas documentadas
 *   (ACCESO, ROL_PERMISO, PERMISO) y NO duplican reglas de negocio.
 * - Requiere la columna `ACCESO.KEYCLOAK_USER_ID`. Si PKG_SEGURIDAD expone
 *   posteriormente procedimientos/funciones dedicados, este repository debe
 *   reemplazar el SQL directo por las llamadas correspondientes.
 */

import { OracleClient } from '../../../../infrastructure/database/oracle/oracle.client';

export interface AccessRecord {
  accesoId: number;
  keycloakUserId: string;
  rolId: number;
  estado: string;
}

export interface AccessAuthorizationRepository {
  findByKeycloakUserId(keycloakUserId: string): Promise<AccessRecord | null>;
  hasPermission(accesoId: number, permissionName: string): Promise<boolean>;
}

interface AccessRow {
  accesoId: number;
  keycloakUserId: string;
  rolId: number;
  estado: string;
}

interface PermissionCountRow {
  total: number;
}

export class DefaultAccessAuthorizationRepository implements AccessAuthorizationRepository {
  constructor(private readonly oracleClient: OracleClient) {}

  async findByKeycloakUserId(keycloakUserId: string): Promise<AccessRecord | null> {
    const result = await this.oracleClient.execute<AccessRow>(
      `
        SELECT
          a.ACCESO_ID        AS "accesoId",
          a.KEYCLOAK_USER_ID AS "keycloakUserId",
          a.ROL_ID           AS "rolId",
          a.ESTADO           AS "estado"
        FROM ACCESO a
        WHERE a.KEYCLOAK_USER_ID = :keycloakUserId
      `,
      { keycloakUserId },
    );

    const row = result.rows?.[0];
    if (row === undefined) {
      return null;
    }

    return {
      accesoId: row.accesoId,
      keycloakUserId: row.keycloakUserId,
      rolId: row.rolId,
      estado: row.estado,
    };
  }

  async hasPermission(accesoId: number, permissionName: string): Promise<boolean> {
    const result = await this.oracleClient.execute<PermissionCountRow>(
      `
        SELECT COUNT(1) AS "total"
        FROM ACCESO a
        JOIN ROL_PERMISO rp ON rp.ROL_ID = a.ROL_ID
        JOIN PERMISO p ON p.PERMISO_ID = rp.PERMISO_ID
        WHERE a.ACCESO_ID = :accesoId
          AND p.NOMBRE = :permissionName
          AND p.ESTADO = 'ACTIVO'
      `,
      { accesoId, permissionName },
    );

    const total = result.rows?.[0]?.total;
    return Number(total ?? 0) > 0;
  }
}
