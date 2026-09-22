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

La integración con Oracle se implementará en una etapa posterior.

## Arquitectura

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Oracle
```

## Tecnologías

```text
Node.js
TypeScript
Express
pnpm
Oracle/PLSQL (integración futura)
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
│   ├── shared/
│   │   ├── database/
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

ORACLE_HOST=
ORACLE_PORT=
ORACLE_SERVICE_NAME=
ORACLE_USER=
ORACLE_PASSWORD=
```

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