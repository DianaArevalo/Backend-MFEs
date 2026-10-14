import { describe, expect, it, vi } from 'vitest';
import { DefaultAccessAuthorizationRepository } from '../src/modules/security/repositories/access/access-authorization.repository';
import type { OracleClient } from '../src/infrastructure/database/oracle/oracle.client';

function createFakeClient(result: unknown): {
  client: OracleClient;
  execute: ReturnType<typeof vi.fn>;
} {
  const execute = vi.fn().mockResolvedValue(result);
  return {
    client: { execute } as unknown as OracleClient,
    execute,
  };
}

describe('DefaultAccessAuthorizationRepository', () => {
  it('resolves an access by keycloakUserId and maps the row', async () => {
    const { client, execute } = createFakeClient({
      rows: [
        {
          accesoId: 10,
          keycloakUserId: 'sub-123',
          rolId: 2,
          estado: 'ACTIVO',
        },
      ],
    });

    const repository = new DefaultAccessAuthorizationRepository(client);
    const access = await repository.findByKeycloakUserId('sub-123');

    expect(access).toEqual({
      accesoId: 10,
      keycloakUserId: 'sub-123',
      rolId: 2,
      estado: 'ACTIVO',
    });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0][1]).toEqual({ keycloakUserId: 'sub-123' });
  });

  it('returns null when there is no access linked to the keycloak user', async () => {
    const { client } = createFakeClient({ rows: [] });

    const repository = new DefaultAccessAuthorizationRepository(client);

    await expect(repository.findByKeycloakUserId('unknown')).resolves.toBeNull();
  });

  it('returns null when Oracle returns no rows collection', async () => {
    const { client } = createFakeClient({});

    const repository = new DefaultAccessAuthorizationRepository(client);

    await expect(repository.findByKeycloakUserId('unknown')).resolves.toBeNull();
  });

  it('reports an existing permission for the access role', async () => {
    const { client, execute } = createFakeClient({ rows: [{ total: 1 }] });

    const repository = new DefaultAccessAuthorizationRepository(client);
    const authorized = await repository.hasPermission(10, 'ACCESO_CREAR');

    expect(authorized).toBe(true);
    expect(execute.mock.calls[0][1]).toEqual({
      accesoId: 10,
      permissionName: 'ACCESO_CREAR',
    });
  });

  it('reports a missing permission when the count is zero', async () => {
    const { client } = createFakeClient({ rows: [{ total: 0 }] });

    const repository = new DefaultAccessAuthorizationRepository(client);

    await expect(repository.hasPermission(10, 'ACCESO_HABILITAR')).resolves.toBe(false);
  });

  it('reports a missing permission when Oracle returns no count', async () => {
    const { client } = createFakeClient({ rows: [] });

    const repository = new DefaultAccessAuthorizationRepository(client);

    await expect(repository.hasPermission(10, 'ACCESO_HABILITAR')).resolves.toBe(false);
  });

  it('propagates Oracle errors', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('ORA-12541: TNS:no listener'));
    const client = { execute } as unknown as OracleClient;

    const repository = new DefaultAccessAuthorizationRepository(client);

    await expect(repository.findByKeycloakUserId('sub-123')).rejects.toThrow('ORA-12541');
  });
});
