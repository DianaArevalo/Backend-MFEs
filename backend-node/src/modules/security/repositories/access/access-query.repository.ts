/**
 * Repository responsable de las consultas relacionadas con accesos y roles.
 *
 * PL/SQL:
 * - PKG_SEGURIDAD.SP_GET_ACCESOS_ROL
 * - PKG_SEGURIDAD.FN_TIENE_ROL
 * - PKG_SEGURIDAD.FN_ROL_ACCESO
 *
 * Responsabilidad:
 * - Obtener los accesos asociados a un rol.
 * - Determinar si un acceso posee un rol específico.
 * - Obtener el rol asociado a un acceso.
 *
 * Nota:
 * - Las consultas y reglas definidas por PKG_SEGURIDAD deben respetarse.
 * - Este repository se encarga de ejecutar SPs/funciones y transformar
 *   el resultado de Oracle cuando sea necesario.
 */