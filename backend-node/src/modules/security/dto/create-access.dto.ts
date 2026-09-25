export interface CreateAccessDto {
  nombre_usuario: string;
  contrasena: string;
  rol_id: number;
  afiliado_id?: number;
  empresa_id?: number;
}
