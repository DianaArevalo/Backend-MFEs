import { describe, expect, it, vi } from 'vitest';
import { AccessCreateService } from '../src/modules/security/services/access-create.service';
import type { AccessCreateRepository } from '../src/modules/security/repositories/access/access-create.repository';

describe('AccessCreateService', () => {
  it('passes the Keycloak identity and role associations to the repository unchanged', async () => {
    const createAccess = vi.fn().mockResolvedValue(15);
    const service = new AccessCreateService({ createAccess } as unknown as AccessCreateRepository);
    const input = {
      keycloak_user_id: 'kc-sub-123',
      rol_id: 2,
      afiliado_id: 5,
      empresa_id: 6,
    };

    await expect(service.createAccess(input)).resolves.toBe(15);
    expect(createAccess).toHaveBeenCalledWith(input);
  });
});
