export interface CreateAccessResponse {
  acceso_id: number;
}

export class AccessMapper {
  static toCreateResponse(accesoId: number): CreateAccessResponse {
    return {
      acceso_id: accesoId,
    };
  }
}