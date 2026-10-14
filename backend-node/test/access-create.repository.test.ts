import { describe, expect, it, vi } from 'vitest';
import oracledb from 'oracledb';
import { AccessCreateRepository } from '../src/modules/security/repositories/access/access-create.repository';
import type { OracleClient } from '../src/infrastructure/database/oracle/oracle.client';

describe('AccessCreateRepository', () => {
  it('calls SP_ADD_ACCESO with the confirmed contract and optional values', async () => {
    const execute = vi.fn().mockResolvedValue({ outBinds: { P_ACCESO_ID: 42 } });
    const repository = new AccessCreateRepository({ execute } as unknown as OracleClient);

    await expect(repository.createAccess({
      keycloak_user_id: 'kc-sub-123',
      rol_id: 3,
      afiliado_id: 8,
      empresa_id: 9,
    })).resolves.toBe(42);

    const [sql, binds, options] = execute.mock.calls[0];
    expect(sql).toContain('PKG_SEGURIDAD.SP_ADD_ACCESO');
    expect(sql).toContain(':P_KEYCLOAK_USER_ID,\n        :P_ROL_ID,\n        :P_AFILIADO_ID,\n        :P_EMPRESA_ID,\n        :P_ACCESO_ID');
    expect(binds).toEqual({
      P_KEYCLOAK_USER_ID: 'kc-sub-123',
      P_ROL_ID: 3,
      P_AFILIADO_ID: 8,
      P_EMPRESA_ID: 9,
      P_ACCESO_ID: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    });
    expect(options).toEqual({ autoCommit: true });
  });

  it('binds omitted optional values as null', async () => {
    const execute = vi.fn().mockResolvedValue({ outBinds: { P_ACCESO_ID: 43 } });
    const repository = new AccessCreateRepository({ execute } as unknown as OracleClient);

    await repository.createAccess({ keycloak_user_id: 'kc-sub-456', rol_id: 2 });

    expect(execute.mock.calls[0][1]).toMatchObject({
      P_KEYCLOAK_USER_ID: 'kc-sub-456',
      P_ROL_ID: 2,
      P_AFILIADO_ID: null,
      P_EMPRESA_ID: null,
    });
  });
});
