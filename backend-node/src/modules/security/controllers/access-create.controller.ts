import { Request, Response } from 'express';
import { AccessCreateService } from '../services/access-create.service';
import { CreateAccessDto } from '../dto/create-access.dto';
import { AccessMapper } from '../mappers/access.mapper';
import { successResponse } from '../../../shared/api/api-response';

export class AccessController {
  constructor(
    private readonly accessCreateService: AccessCreateService,
  ) {}

  async createAccess(
    req: Request,
    res: Response,
  ): Promise<void> {
    const data: CreateAccessDto = req.body;

    const accesoId = await this.accessCreateService.createAccess(data);

    const responseData = AccessMapper.toCreateResponse(accesoId);

    res.status(201).json(
      successResponse('Acceso creado correctamente.', responseData),
    );
  }
}