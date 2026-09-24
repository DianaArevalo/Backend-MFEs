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
```

> `ORACLE_SERVICE_NAME` se acepta como alternativa a `ORACLE_SERVICE`.
> Las variables `ORACLE_POOL_*` son opcionales; si no se definen se usan los
> valores por defecto (`0`, `10` y `1` respectivamente).

No se almacenan credenciales reales en el repositorio.

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