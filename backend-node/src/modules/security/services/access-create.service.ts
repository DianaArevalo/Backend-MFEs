import { CreateAccessDto } from '../dto/create-access.dto';
import {
  AccessCreateRepository,
  CreateAccessRepositoryData,
} from '../repositories/access/access-create.repository';

export class AccessCreateService {
  constructor(
    private readonly accessCreateRepository: AccessCreateRepository,
  ) {}

  async createAccess(data: CreateAccessDto): Promise<number> {
    const repositoryData: CreateAccessRepositoryData = {
      keycloak_user_id: data.keycloak_user_id,
      rol_id: data.rol_id,
      afiliado_id: data.afiliado_id,
      empresa_id: data.empresa_id,
    };

    return await this.accessCreateRepository.createAccess(
      repositoryData,
    );
  }
}
