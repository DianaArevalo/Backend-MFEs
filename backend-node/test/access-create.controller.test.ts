import { describe, expect, it, vi } from 'vitest';
import { AccessController } from '../src/modules/security/controllers/access-create.controller';
import type { AccessCreateService } from '../src/modules/security/services/access-create.service';

function createResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

describe('AccessController', () => {
  it('validates and forwards the Keycloak user id and optional associations', async () => {
    const createAccess = vi.fn().mockResolvedValue(33);
    const controller = new AccessController({ createAccess } as unknown as AccessCreateService);
    const req = { body: {
      keycloak_user_id: 'kc-sub-1',
      rol_id: 4,
      afiliado_id: 10,
      empresa_id: 20,
    } } as never;
    const res = createResponse() as never;

    await controller.createAccess(req, res);

    expect(createAccess).toHaveBeenCalledWith(req.body);
    expect((res as { status: ReturnType<typeof vi.fn> }).status).toHaveBeenCalledWith(201);
  });

  it('rejects an empty Keycloak id before calling the service', async () => {
    const createAccess = vi.fn();
    const controller = new AccessController({ createAccess } as unknown as AccessCreateService);
    const req = { body: { keycloak_user_id: ' ', rol_id: 1 } } as never;
    const res = createResponse() as never;

    await expect(controller.createAccess(req, res)).rejects.toMatchObject({
      statusCode: 400,
      message: 'keycloak_user_id is required',
    });
    expect(createAccess).not.toHaveBeenCalled();
  });

  it('rejects a non-positive role id', async () => {
    const controller = new AccessController({ createAccess: vi.fn() } as unknown as AccessCreateService);
    const req = { body: { keycloak_user_id: 'kc-sub-1', rol_id: 0 } } as never;

    await expect(controller.createAccess(req, createResponse() as never)).rejects.toMatchObject({
      statusCode: 400,
      message: 'rol_id must be a positive integer',
    });
  });
});
