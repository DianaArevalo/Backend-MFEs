# NUTRIA — Backend Node.js

> 🎓 **Taller práctico de desarrollo de software**
>
> Este proyecto forma parte del taller práctico **NUTRIA**, desarrollado con
> fines académicos y de aprendizaje para aplicar conceptos de arquitectura
> distribuida, desarrollo de microservicios e integración con Oracle PL/SQL.
>
> **No corresponde a un sistema productivo ni a una implementación real de
> una organización.** Las tecnologías, dominios y decisiones de arquitectura
> se utilizan como parte del alcance definido para el taller.

## Responsabilidad

Este backend Node.js corresponde a uno de los microservicios del taller
**NUTRIA** y está encargado de dos dominios:

- **Seguridad**: usuarios, roles, permisos, accesos y autenticación/autorización.
- **Afiliados**: gestión, consulta, actualización y activación/desactivación de afiliados.

La lógica de negocio permanece centralizada en Oracle/PL-SQL. Este backend
funciona como capa de exposición, integración y transformación de datos.

## Paquetes Oracle

```text
PKG_SEGURIDAD
PKG_AFILIADOS
```

La lógica de negocio (validaciones, reglas y persistencia) reside en estos
paquetes PL/SQL. Los repositories del backend no la duplican: únicamente
construyen la llamada al procedimiento/función correspondiente y transforman
el resultado.

## Arquitectura

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
OracleClient (src/infrastructure/database/oracle/oracle.client.ts)
    ↓
Pool Oracle (src/infrastructure/database/oracle/oracle.pool.ts)
    ↓
Oracle / PKG_SEGURIDAD · PKG_AFILIADOS
```

El acceso a Oracle está centralizado en la infraestructura
`src/infrastructure/database/oracle/`, que es **genérica**: no conoce nombres
de paquetes ni lógica de negocio. La responsabilidad de construir las
llamadas PL/SQL corresponde exclusivamente a cada repository.

## Infraestructura Oracle

```text
src/infrastructure/database/oracle/
├── oracle.config.ts   # Lee/valida variables de entorno y arma el connectString
├── oracle.errors.ts   # Clasifica errores ORA/NJS (conectividad, ejecución,
│                      # RAISE_APPLICATION_ERROR, constraints, desconocidos)
├── oracle.pool.ts     # Pool único por proceso: initializePool/getPool/closePool
└── oracle.client.ts   # Punto de entrada de los repositories: execute(sql, binds, options)
```

- `oracle.config.ts` reutiliza `src/shared/config/config.ts` y valida
  `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_HOST`, `ORACLE_PORT` y
  `ORACLE_SERVICE` (con soporte para `ORACLE_SERVICE_NAME`); además configura
  el pool. No crea conexiones.
- `oracle.errors.ts` conserva `errorNum`, `offset`, `code` y el mensaje
  original de Oracle para logging técnico. Permite distinguir:
  - errores de conectividad → `OracleConnectionError`;
  - errores de ejecución → `OracleExecutionError`;
  - `RAISE_APPLICATION_ERROR` → `OracleBusinessError`;
  - errores de constraints → `OracleConstraintError`;
  - errores desconocidos → `OracleError`.
- `oracle.pool.ts` administra **una única instancia** de pool por proceso.
  Falla con `OraclePoolNotInitializedError` si se usa antes de inicializar y
  no oculta errores de inicialización. El pool se crea al arrancar el server
  (`src/app/server.ts`) y se cierra en SIGINT/SIGTERM.
- `oracle.client.ts` obtiene una conexión del pool, ejecuta SQL o bloques
  PL/SQL con binds nombrados (IN, OUT, IN OUT) y **siempre** devuelve la
  conexión al pool, incluso si ocurre una excepción. No conoce paquetes
  específicos.

## Flujo: Repository → OracleClient → Pool → Oracle

```text
Repository (construye el PL/SQL)
    │
    ▼
oracleClient.execute(sql, binds, options)
    │
    ├─ getPool() ──► OraclePoolNotInitializedError si el pool no está listo
    │
    ▼
pool.getConnection()
    │
    ▼
connection.execute(sql, binds, options)
    │            │
    │            └─► oracle.errors.ts traduce/centraliza errores
    │
    ▼
Result<T> (rows / outBinds / rowsAffected)
    │
    │  finally ──► connection.close() (la conexión vuelve al pool)
    ▼
Repository / Service
```

### Repositories de seguridad y su flujo

Cada repository inyecta la interfaz `OracleClient` y construye la llamada al
paquete PL/SQL correspondiente:

| Repository | Operación | PL/SQL invocado |
|---|---|---|
| `AccessCreateRepository` | Crear acceso | `PKG_SEGURIDAD.SP_ADD_ACCESO` |
| `AccessUpdateRepository` | Actualizar acceso | `PKG_SEGURIDAD.SP_UPDATE_ACCESO` |
| `AccessStatusRepository` | Activar/deshabilitar acceso | `PKG_SEGURIDAD.SP_ENABLE_ACCESO` · `PKG_SEGURIDAD.SP_DISABLE_ACCESO` |
| `AccessQueryRepository` | Consultas de accesos/roles | `PKG_SEGURIDAD.SP_GET_ACCESOS_ROL` · `FN_TIENE_ROL` · `FN_ROL_ACCESO` |

Ejemplo de una llamada (la firma PL/SQL depende del paquete correspondiente):

```ts
const result = await this.oracleClient.execute(
  `
    BEGIN
      PKG_SEGURIDAD.SP_ADD_ACCESO(
        :P_NOMBRE_USUARIO,
        :P_CONTRASENA_HASH,
        :P_ROL_ID,
        :P_AFILIADO_ID,
        :P_EMPRESA_ID,
        :P_ACCESO_ID
      );
    END;
  `,
  {
    P_NOMBRE_USUARIO: data.nombre_usuario,
    P_CONTRASENA_HASH: data.contrasena_hash,
    P_ROL_ID: data.rol_id,
    P_AFILIADO_ID: data.afiliado_id ?? null,
    P_EMPRESA_ID: data.empresa_id ?? null,
    P_ACCESO_ID: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },
  },
);
```

## Tecnologías

```text
Node.js
TypeScript
Express
pnpm
node-oracledb (Thin mode)
Oracle/PLSQL
jose (validación de JWT/Keycloak)
```

## Estructura

```text
backend-node/
│
├── src/
│   ├── modules/
│   │   ├── security/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── dto/
│   │   │   └── mappers/
│   │   └── affiliates/
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── repositories/
│   │       ├── dto/
│   │       └── mappers/
│   ├── infrastructure/
│   │   └── database/
│   │       └── oracle/
│   │           ├── oracle.config.ts
│   │           ├── oracle.errors.ts
│   │           ├── oracle.pool.ts
│   │           └── oracle.client.ts
│   ├── shared/
│   │   ├── errors/
│   │   ├── middleware/
│   │   └── config/
│   └── app/
├── test/
├── .env.example
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
└── README.md
```

## Autenticación y autorización con Keycloak + Oracle

El flujo es: **Keycloak autentica → Node valida el JWT → Oracle determina
roles/permisos → Node aplica la autorización**.

La validación de access tokens vive en `src/shared/middleware/auth.middleware.ts`
y expone el middleware reutilizable `authenticateToken`. No se aplica de forma
global: debe incorporarse explícitamente a las rutas que lo requieran.

`authenticateToken`:

- exige `Authorization: Bearer <token>`;
- valida firma, `issuer`, `audience`, expiración y la existencia de un `sub`
  no vacío con `jwtVerify` y `createRemoteJWKSet` de `jose`;
- responde `401` cuando el token falta, está mal formado, es inválido o expiró;
- responde `503` de forma controlada si no puede recuperarse el JWKS;
- adjunta `req.user` con el tipo `AuthenticatedUser`
  (`{ keycloakUserId: string }`) únicamente después de validar el token;
- no expone tokens, claves ni detalles internos en las respuestas.

### Autorización por permisos de Oracle

La autorización de negocio se resuelve contra Oracle a partir de
`req.user.keycloakUserId`:

- `src/modules/security/repositories/access/access-authorization.repository.ts`
  resuelve el `ACCESO` por `ACCESO.KEYCLOAK_USER_ID` y comprueba el permiso a
  través de la relación `ACCESO → ROL → ROL_PERMISO → PERMISO`.
- `src/modules/security/services/access-authorization.service.ts` distingue
  `NOT_LINKED` (autenticado sin acceso), `DISABLED` (acceso deshabilitado) y
  `ENABLED`.
- `src/modules/security/middleware/authorization.middleware.ts` expone el
  middleware reutilizable `requirePermission(permission, service)`.

```ts
import { authenticateToken } from '../../shared/middleware/auth.middleware';
import { requirePermission } from '../middleware/authorization.middleware';

router.post(
  '/access',
  authenticateToken,
  requirePermission('ACCESO_CREAR', accessAuthorizationService),
  asyncHandler((req, res) => controller.createAccess(req, res)),
);
```

`requirePermission` responde:

- `401` si la request no tiene identidad autenticada (`req.user`);
- `403` si el usuario está autenticado pero no tiene `ACCESO`, el `ACCESO` está
  deshabilitado o no posee el permiso requerido;
- `503` si Oracle (dependencia de autorización) no está disponible.

Los nombres de permiso usados por las rutas son los del bootstrap de seguridad
(`database/seeds/security-bootstrap.sql`): `ACCESO_CREAR`, `ACCESO_CONSULTAR`,
`ACCESO_ACTUALIZAR`, `ACCESO_HABILITAR`, `ACCESO_DESHABILITAR`.

### Contrato Oracle requerido (estado real del repositorio)

> **Verificación realizada:** en el repositorio actual **no existe** DDL de las
> tablas ni el código fuente de `PKG_SEGURIDAD` (solo
> `database/seeds/security-bootstrap.sql`). Por tanto, no fue posible verificar
> la firma de procedimientos ni la existencia física de
> `ACCESO.KEYCLOAK_USER_ID` en el esquema versionado.

Para que la autorización funcione, el esquema de Oracle debe cumplir:

1. `ACCESO.KEYCLOAK_USER_ID` existe y almacena el `sub` del token de Keycloak
   (`SP_ADD_ACCESO` debe persistirlo; ya no se usan contraseñas propias).
2. Estados de `ACCESO`: el servicio considera habilitado el valor `ACTIVO`
   (mismo criterio que `ROL` y `PERMISO` en el bootstrap). Confirmar este valor
   si `SP_ENABLE_ACCESO` / `SP_DISABLE_ACCESO` usan otro.
3. Las tablas `PERMISO` (`NOMBRE`, `ESTADO`) y `ROL_PERMISO`
   (`ROL_ID`, `PERMISO_ID`) existen según el bootstrap.

Las consultas de autorización se implementaron como lectura directa
(parametrizada) porque **no existe** un procedimiento/función apropiado en
`PKG_SEGURIDAD` para resolver el acceso por `KEYCLOAK_USER_ID` ni para
comprobar permisos (solo existen `SP_GET_ACCESOS_ROL`, `FN_TIENE_ROL` y
`FN_ROL_ACCESO`, que operan por `acceso_id`/`rol_id`). **No se inventaron
firmas PL/SQL.** Cuando Oracle exponga funciones dedicadas (p. ej. una consulta
de acceso por `KEYCLOAK_USER_ID` y una verificación de permiso), el repository
debe sustituir el SQL directo por esas llamadas.

### Configuración

La configuración se centraliza en `src/shared/config/config.ts` y se valida /
deriva en `src/shared/config/keycloak.config.ts` (el endpoint JWKS se construye
como `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
sin duplicar URLs).

```text
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=nutria
KEYCLOAK_ISSUER=http://localhost:8080/realms/nutria
KEYCLOAK_AUDIENCE=nutria-api
```

Configuración requerida en Keycloak (realm `nutria`):

- El realm debe firmar los access tokens con el algoritmo `RS256` (es el valor
  aceptado por `authenticateToken`; si el realm usa `PS256`, `ES256`, etc., hay
  que actualizar `ALLOWED_ALGORITHMS` en `auth.middleware.ts`).
- El access token **debe** incluir en `aud` el valor de `KEYCLOAK_AUDIENCE`
  (`nutria-api`). Por defecto Keycloak puede emitir `aud: "account"`; para
  corregirlo hay que añadir un *Audience mapper* (en el cliente o en un client
  scope) que agregue `nutria-api` a `aud`. La validación de audience **no** se
  desactiva: si el token no trae la audiencia esperada, la petición se rechaza
  con `401`.

La identidad validada (`req.user.keycloakUserId`) todavía no se persiste. La
integración con `ACCESO.KEYCLOAK_USER_ID` (columna de Oracle) es un pendiente.

## Configuración

Copiar `.env.example` a `.env` y ajustar los valores según el entorno.

```text
NODE_ENV=development
PORT=3001

ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE=FREEPDB1
ORACLE_USER=
ORACLE_PASSWORD=

ORACLE_POOL_MIN=0
ORACLE_POOL_MAX=10
ORACLE_POOL_INCREMENT=1

KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=nutria
KEYCLOAK_ISSUER=http://localhost:8080/realms/nutria
KEYCLOAK_AUDIENCE=nutria-api
```

> `ORACLE_SERVICE_NAME` se acepta como alternativa a `ORACLE_SERVICE`.
> Las variables `ORACLE_POOL_*` son opcionales; si no se definen se usan los
> valores por defecto (`0`, `10` y `1` respectivamente).

No se almacenan credenciales reales en el repositorio.

### Creacion y aprovisionamiento de accesos

`POST /api/security/access` recibe `keycloak_user_id` (el `sub` de una
identidad ya existente en Keycloak), `rol_id` y, opcionalmente,
`afiliado_id` y `empresa_id`. El backend envÃ­a esos datos a
`PKG_SEGURIDAD.SP_ADD_ACCESO`; no crea usuarios en Keycloak ni gestiona
credenciales.

La ruta exige un access token valido y el permiso `ACCESO_CREAR`. El alta de
la identidad en Keycloak y su vinculacion inicial con Oracle requieren por
tanto un proceso administrativo separado. Ese aprovisionamiento no forma
parte de este endpoint.

## Instalación

```bash
pnpm install
```

## Desarrollo

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

## Producción

```bash
pnpm start
```

## Test

```bash
pnpm test
```

## Health Check

```bash
GET /health
```

```json
{
  "status": "UP",
  "service": "nutria-backend-node"
}
```
