/**
 * Servicio de autorización de accesos.
 *
 * Responsabilidad:
 * - Resolver el estado del ACCESO asociado a la identidad autenticada
 *   (sin acceso, deshabilitado o habilitado).
 * - Comprobar si el ACCESO posee un permiso concreto.
 *
 * La determinación de roles/permisos corresponde a Oracle; este servicio
 * únicamente orquesta la consulta y aplica la decisión.
 */

import {
  AccessAuthorizationRepository,
  AccessRecord,
} from '../repositories/access/access-authorization.repository';

/**
 * Estado de un ACCESO habilitado. La tabla ACCESO usa el valor documentado
 * `ACTIVO` (mismo criterio que ROL y PERMISO en el bootstrap de seguridad).
 */
const ENABLED_ACCESS_STATE = 'ACTIVO';

export type AccessResolution =
  | { status: 'NOT_LINKED' }
  | { status: 'DISABLED'; access: AccessRecord }
  | { status: 'ENABLED'; access: AccessRecord };

export class AccessAuthorizationService {
  constructor(private readonly repository: AccessAuthorizationRepository) {}

  async resolveAccess(keycloakUserId: string): Promise<AccessResolution> {
    const access = await this.repository.findByKeycloakUserId(keycloakUserId);

    if (access === null) {
      return { status: 'NOT_LINKED' };
    }

    if (this.isEnabled(access)) {
      return { status: 'ENABLED', access };
    }

    return { status: 'DISABLED', access };
  }

  async hasPermission(access: AccessRecord, permissionName: string): Promise<boolean> {
    return this.repository.hasPermission(access.accesoId, permissionName);
  }

  private isEnabled(access: AccessRecord): boolean {
    return access.estado.trim().toUpperCase() === ENABLED_ACCESS_STATE;
  }
}
