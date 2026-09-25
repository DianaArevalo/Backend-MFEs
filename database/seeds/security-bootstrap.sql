/* ============================================================
   NUTRIA - SECURITY BOOTSTRAP
   Inicialización de seguridad del sistema

   Incluye:
   1. Roles iniciales
   2. Permisos iniciales
   3. Relaciones ROL_PERMISO
   4. Primer usuario ADMIN

   IMPORTANTE:
   - Las reglas de negocio para crear ACCESO siguen viviendo
     en PKG_SEGURIDAD.SP_ADD_ACCESO.
   - Este script únicamente inicializa datos.
   ============================================================ */


/* ============================================================
   1. ROLES INICIALES
   ============================================================ */

MERGE INTO ROL r
USING (
    SELECT 'ADMIN' AS nombre_usuario,
           'Administrador del sistema' AS descripcion
    FROM dual

    UNION ALL

    SELECT 'OPERADOR',
           'Operador del sistema'
    FROM dual

    UNION ALL

    SELECT 'AFILIADO',
           'Usuario afiliado'
    FROM dual

    UNION ALL

    SELECT 'EMPRESA',
           'Usuario empresa'
    FROM dual
) src
ON (r.NOMBRE_USUARIO = src.nombre_usuario)

WHEN MATCHED THEN
    UPDATE SET
        r.DESCRIPCION = src.descripcion,
        r.ESTADO = 'ACTIVO'

WHEN NOT MATCHED THEN
    INSERT (
        ROL_ID,
        NOMBRE_USUARIO,
        DESCRIPCION,
        ESTADO,
        FECHA_CREACION
    )
    VALUES (
        ROL_SEQ.NEXTVAL,
        src.nombre_usuario,
        src.descripcion,
        'ACTIVO',
        SYSDATE
    );


/* ============================================================
   2. PERMISOS INICIALES
   ============================================================ */

/*
   Estos nombres son una propuesta inicial.
   Deben ajustarse si el documento define posteriormente
   un catálogo diferente de permisos.
*/

MERGE INTO PERMISO p
USING (
    SELECT 'ACCESO_CREAR' AS nombre,
           'Crear accesos de usuario' AS descripcion
    FROM dual

    UNION ALL

    SELECT 'ACCESO_CONSULTAR',
           'Consultar accesos de usuario'
    FROM dual

    UNION ALL

    SELECT 'ACCESO_ACTUALIZAR',
           'Actualizar accesos de usuario'
    FROM dual

    UNION ALL

    SELECT 'ACCESO_HABILITAR',
           'Habilitar accesos de usuario'
    FROM dual

    UNION ALL

    SELECT 'ACCESO_DESHABILITAR',
           'Deshabilitar accesos de usuario'
    FROM dual
) src
ON (p.NOMBRE = src.nombre)

WHEN MATCHED THEN
    UPDATE SET
        p.DESCRIPCION = src.descripcion,
        p.ESTADO = 'ACTIVO'

WHEN NOT MATCHED THEN
    INSERT (
        PERMISO_ID,
        NOMBRE,
        DESCRIPCION,
        ESTADO,
        FECHA_CREACION
    )
    VALUES (
        DEFAULT,
        src.nombre,
        src.descripcion,
        'ACTIVO',
        SYSDATE
    );


/* ============================================================
   3. RELACIONES ROL_PERMISO
   ============================================================ */

/*
   ADMIN:
   Todos los permisos definidos inicialmente.
*/

INSERT INTO ROL_PERMISO (
    ROL_ID,
    PERMISO_ID
)
SELECT
    r.ROL_ID,
    p.PERMISO_ID
FROM ROL r
CROSS JOIN PERMISO p
WHERE r.NOMBRE_USUARIO = 'ADMIN'
  AND p.ESTADO = 'ACTIVO'
  AND NOT EXISTS (
      SELECT 1
      FROM ROL_PERMISO rp
      WHERE rp.ROL_ID = r.ROL_ID
        AND rp.PERMISO_ID = p.PERMISO_ID
  );


/*
   OPERADOR:
   Permisos operativos sobre accesos.
*/

INSERT INTO ROL_PERMISO (
    ROL_ID,
    PERMISO_ID
)
SELECT
    r.ROL_ID,
    p.PERMISO_ID
FROM ROL r
JOIN PERMISO p
    ON p.NOMBRE IN (
        'ACCESO_CREAR',
        'ACCESO_CONSULTAR',
        'ACCESO_ACTUALIZAR'
    )
WHERE r.NOMBRE_USUARIO = 'OPERADOR'
  AND p.ESTADO = 'ACTIVO'
  AND NOT EXISTS (
      SELECT 1
      FROM ROL_PERMISO rp
      WHERE rp.ROL_ID = r.ROL_ID
        AND rp.PERMISO_ID = p.PERMISO_ID
  );


/* ============================================================
   4. CREAR PRIMER ADMIN
   ============================================================ */

/*
   IMPORTANTE:
   Reemplazar el valor por un HASH BCRYPT REAL.

   Ejemplo de formato:
   $2b$10$.....................................................
*/

DEFINE ADMIN_PASSWORD_HASH = 'REEMPLAZAR_POR_HASH_BCRYPT';


DECLARE
    V_ROL_ID      ROL.ROL_ID%TYPE;
    V_ACCESO_ID   ACCESO.ACCESO_ID%TYPE;
    V_EXISTE      NUMBER;
BEGIN

    /* --------------------------------------------------------
       Obtener rol ADMIN
       -------------------------------------------------------- */

    SELECT ROL_ID
    INTO V_ROL_ID
    FROM ROL
    WHERE NOMBRE_USUARIO = 'ADMIN';


    /* --------------------------------------------------------
       Verificar si el administrador ya existe
       -------------------------------------------------------- */

    SELECT COUNT(*)
    INTO V_EXISTE
    FROM ACCESO
    WHERE NOMBRE_USUARIO = 'admin';


    /* --------------------------------------------------------
       Crear administrador solamente si no existe
       -------------------------------------------------------- */

    IF V_EXISTE = 0 THEN

        PKG_SEGURIDAD.SP_ADD_ACCESO(
            P_NOMBRE_USUARIO  => 'admin',
            P_CONTRASENA_HASH => '&ADMIN_PASSWORD_HASH',
            P_ROL_ID          => V_ROL_ID,
            P_AFILIADO_ID     => NULL,
            P_EMPRESA_ID      => NULL,
            P_ACCESO_ID       => V_ACCESO_ID
        );

        DBMS_OUTPUT.PUT_LINE(
            'ADMIN creado. ACCESO_ID: ' || V_ACCESO_ID
        );

    ELSE

        DBMS_OUTPUT.PUT_LINE(
            'El usuario ADMIN ya existe. No se creó nuevamente.'
        );

    END IF;

END;
/

/* ============================================================
   5. CONFIRMAR CAMBIOS
   ============================================================ */

COMMIT;


/* ============================================================
   6. VALIDACIÓN
   ============================================================ */

SELECT
    ROL_ID,
    NOMBRE_USUARIO,
    ESTADO
FROM ROL
ORDER BY ROL_ID;


SELECT
    PERMISO_ID,
    NOMBRE,
    ESTADO
FROM PERMISO
ORDER BY PERMISO_ID;


SELECT
    r.NOMBRE_USUARIO AS ROL,
    p.NOMBRE AS PERMISO
FROM ROL_PERMISO rp
JOIN ROL r
    ON r.ROL_ID = rp.ROL_ID
JOIN PERMISO p
    ON p.PERMISO_ID = rp.PERMISO_ID
ORDER BY r.NOMBRE_USUARIO, p.NOMBRE;


SELECT
    ACCESO_ID,
    NOMBRE_USUARIO,
    ROL_ID,
    ESTADO,
    FECHA_CREACION
FROM ACCESO
WHERE NOMBRE_USUARIO = 'admin';