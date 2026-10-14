export interface CreateAccessDto {
  keycloak_user_id: string;
  rol_id: number;
  afiliado_id?: number;
  empresa_id?: number;
}
