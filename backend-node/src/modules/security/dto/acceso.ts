export interface Acceso {
  acceso_id: number;
  nombre_usuario: string;
  contrasena_usuario: string;

  rol_id: number;

  afiliado_id?: number;
  empresa_id?: number;

  estado: string;
  fecha_creacion: string;
}