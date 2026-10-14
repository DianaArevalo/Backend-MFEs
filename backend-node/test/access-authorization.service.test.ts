import { describe, expect, it, vi } from 'vitest';
import { AccessAuthorizationService } from '../src/modules/security/services/access-authorization.service';
import type {
  AccessAuthorizationRepository,
  AccessRecord,
} from '../src/modules/security/repositories/access/access-authorization.repository';

function createRepository(options: {
  access?: AccessRecord | null;
  permission?: boolean;
  findError?: unknown;
  permissionError?: unknown;
}): {
  repository: AccessAuthorizationRepository;
  findByKeycloakUserId: ReturnType<typeof vi.fn>;
  hasPermission: ReturnType<typeof vi.fn>;
} {
  const findByKeycloakUserId = vi.fn(async () => {
    if (options.findError !== undefined) {
      throw options.findError;
    }
    return options.access ?? null;
  });

  const hasPermission = vi.fn(async () => {
    if (options.permissionError !== undefined) {
      throw options.permissionError;
    }
    return options.permission ?? false;
  });

  return {
    repository: { findByKeycloakUserId, hasPermission } as AccessAuthorizationRepository,
    findByKeycloakUserId,
    hasPermission,
  };
}

const enabledAccess: AccessRecord = {
  accesoId: 7,
  keycloakUserId: 'sub-123',
  rolId: 1,
  estado: 'ACTIVO',
};

describe('AccessAuthorizationService', () => {
  it('reports NOT_LINKED when the keycloak user has no access', async () => {
    const { repository } = createRepository({ access: null });
    const service = new AccessAuthorizationService(repository);

    await expect(service.resolveAccess('sub-123')).resolves.toEqual({ status: 'NOT_LINKED' });
  });

  it('reports ENABLED for an active access', async () => {
    const { repository, findByKeycloakUserId } = createRepository({ access: enabledAccess });
    const service = new AccessAuthorizationService(repository);

    const resolution = await service.resolveAccess('sub-123');

    expect(resolution).toEqual({ status: 'ENABLED', access: enabledAccess });
    expect(findByKeycloakUserId).toHaveBeenCalledWith('sub-123');
  });

  it('reports DISABLED for an access that is not active', async () => {
    const disabled = { ...enabledAccess, estado: 'INACTIVO' };
    const { repository } = createRepository({ access: disabled });
    const service = new AccessAuthorizationService(repository);

    const resolution = await service.resolveAccess('sub-123');

    expect(resolution).toEqual({ status: 'DISABLED', access: disabled });
  });

  it('delegates the permission check for the resolved access id', async () => {
    const { repository, hasPermission } = createRepository({
      access: enabledAccess,
      permission: true,
    });
    const service = new AccessAuthorizationService(repository);

    await expect(service.hasPermission(enabledAccess, 'ACCESO_CREAR')).resolves.toBe(true);
    expect(hasPermission).toHaveBeenCalledWith(7, 'ACCESO_CREAR');
  });

  it('propagates repository errors so the caller can map them to a 503', async () => {
    const { repository } = createRepository({ findError: new Error('ORA-12541') });
    const service = new AccessAuthorizationService(repository);

    await expect(service.resolveAccess('sub-123')).rejects.toThrow('ORA-12541');
  });
});
