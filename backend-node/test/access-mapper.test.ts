import { describe, expect, it } from 'vitest';
import { AccessMapper } from '../src/modules/security/mappers/access.mapper';
import { successResponse } from '../src/shared/api/api-response';
import type { ApiResponse } from '../src/shared/api/api-response';

describe('AccessMapper', () => {
  it('transforma el acceso_id del Service en la estructura de respuesta', () => {
    const response = AccessMapper.toCreateResponse(15);

    expect(response).toEqual({ acceso_id: 15 });
  });

  it('no altera el tipo del acceso_id', () => {
    const response = AccessMapper.toCreateResponse(15);

    expect(typeof response.acceso_id).toBe('number');
  });
});

describe('successResponse', () => {
  it('construye una ApiResponse exitosa con message y data', () => {
    const response = successResponse('Acceso creado correctamente.', {
      acceso_id: 15,
    });

    expect(response).toEqual({
      success: true,
      message: 'Acceso creado correctamente.',
      data: { acceso_id: 15 },
    });

    const typed: ApiResponse<{ acceso_id: number }> = response;
    expect(typed.data.acceso_id).toBe(15);
  });
});