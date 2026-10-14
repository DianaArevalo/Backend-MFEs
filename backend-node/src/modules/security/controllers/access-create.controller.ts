import { Request, Response } from 'express';
import { AccessCreateService } from '../services/access-create.service';
import { CreateAccessDto } from '../dto/create-access.dto';
import { AccessMapper } from '../mappers/access.mapper';
import { successResponse } from '../../../shared/api/api-response';
import { AppError } from '../../../shared/errors/app-error';

export class AccessController {
  constructor(
    private readonly accessCreateService: AccessCreateService,
  ) {}

  async createAccess(
    req: Request,
    res: Response,
  ): Promise<void> {
    const data = this.validateCreateAccessDto(req.body);

    const accesoId = await this.accessCreateService.createAccess(data);

    const responseData = AccessMapper.toCreateResponse(accesoId);

    res.status(201).json(
      successResponse('Acceso creado correctamente.', responseData),
    );
  }

  private validateCreateAccessDto(body: unknown): CreateAccessDto {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new AppError('Invalid request body', 400);
    }

    const data = body as Record<string, unknown>;
    if (typeof data.keycloak_user_id !== 'string' || data.keycloak_user_id.trim() === '') {
      throw new AppError('keycloak_user_id is required', 400);
    }

    if (!Number.isInteger(data.rol_id) || (data.rol_id as number) <= 0) {
      throw new AppError('rol_id must be a positive integer', 400);
    }

    for (const field of ['afiliado_id', 'empresa_id'] as const) {
      const value = data[field];
      if (value !== undefined && value !== null && (!Number.isInteger(value) || (value as number) <= 0)) {
        throw new AppError(`${field} must be a positive integer`, 400);
      }
    }

    return {
      keycloak_user_id: data.keycloak_user_id,
      rol_id: data.rol_id as number,
      afiliado_id: data.afiliado_id as number | undefined,
      empresa_id: data.empresa_id as number | undefined,
    };
  }
}
