export interface CreateAccessDto {
  nombre_usuario: string;
  contrasena_hash: string;
  rol_id: number;
  afiliado_id?: number;
  empresa_id?: number;
  estado: string;
  fecha_creacion: string;
}
