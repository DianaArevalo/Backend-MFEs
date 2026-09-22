<div align="center">

# 🚀 NUTRIA

### Sistema Integral de Gestión de Afiliados, Aportes y Pensiones

<p>
  <strong>Arquitectura distribuida · Next.js · Node.js · Java · .NET · Oracle PL/SQL</strong>
</p>

<br>

![Status](https://img.shields.io/badge/status-in%20development-yellow?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-Frontend-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-API-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Java](https://img.shields.io/badge/Java-Spring%20Boot-orange?style=for-the-badge&logo=openjdk&logoColor=white)
![.NET](https://img.shields.io/badge/.NET-ASP.NET%20Core-512BD4?style=for-the-badge&logo=.net&logoColor=white)
![Oracle](https://img.shields.io/badge/Oracle-PL%2FSQL-F80000?style=for-the-badge&logo=oracle&logoColor=white)

</div>

---

## 📌 Sobre NUTRIA

**NUTRIA** es un sistema orientado a la gestión integral de:

- 👤 Afiliados
- 🔐 Seguridad, usuarios, roles y permisos
- 🏢 Empresas aportantes
- 💰 Aportes
- 💼 Historial laboral
- 👴 Solicitudes de pensión
- ⚠️ Gestión centralizada de errores

La solución utiliza una arquitectura distribuida donde **Next.js** funciona como frontend y las operaciones de negocio son atendidas por APIs desarrolladas con **Node.js, Java/Spring Boot y ASP.NET Core**, consumiendo los paquetes **PL/SQL de Oracle**.

> 💡 **Principio arquitectónico:** la lógica de negocio definida en Oracle/PLSQL permanece centralizada en los paquetes correspondientes. Los backends funcionan como capa de exposición, integración y transformación de datos.

---

# 🏗️ Arquitectura

<div align="center">

### 🔄 Flujo general

```text
                         ┌─────────────────────┐
                         │      Next.js        │
                         │      Frontend       │
                         └──────────┬──────────┘
                                    │
                              REST / HTTPS
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  API Gateway / BFF  │
                         │                     │
                         │ 🔐 Auth             │
                         │ 🧭 Routing          │
                         │ 📊 Logging          │
                         │ 🚦 Rate Limiting    │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
        ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
        │    Node.js     │ │      Java      │ │      .NET      │
        │                │ │                │ │                │
        │ 🔐 Seguridad   │ │ 🏢 Empresas   │ │ 👴 Pensiones   │
        │ 👤 Afiliados   │ │ 💰 Aportes     │ │                │
        │                │ │ 💼 Historial   │ │                │
        └───────┬────────┘ └───────┬────────┘ └───────┬────────┘
                │                  │                  │
                └──────────────────┼──────────────────┘
                                   │
                                   ▼
                         ┌─────────────────────┐
                         │       Oracle        │
                         │      Database       │
                         │                     │
                         │      PL / SQL       │
                         └─────────────────────┘
```

</div>

---

# 🖼️ Diagrama de arquitectura

El proyecto incluye el diagrama visual completo:

<p align="center">
  <img src="docs/architecture.png" alt="Arquitectura NUTRIA" width="100%">
</p>

---

# 🧩 Distribución de servicios

| 🛠️ Tecnología | 🎯 Dominio | 📦 Paquetes PL/SQL |
|---|---|---|
| 🟢 **Node.js** | Seguridad + Afiliados | `PKG_SEGURIDAD` · `PKG_AFILIADOS` |
| 🟠 **Java / Spring Boot** | Empresas + Aportes + Historial | `PKG_EMPRESAS` · `PKG_APORTES` · `PKG_HISTORIAL_LABORAL` |
| 🟣 **ASP.NET Core** | Pensiones | `PKG_PENSIONES` |
| 🔴 **Oracle PL/SQL** | Persistencia + reglas de negocio | Todos los paquetes |

---

# 🔐 Node.js — Seguridad & Afiliados

### 📦 Responsabilidades

- 👤 Gestión de usuarios
- 🔑 Roles
- 🛡️ Permisos
- 🔐 Autenticación y autorización
- 👥 Gestión de afiliados
- 🔄 Activación/desactivación de afiliados

### 🗄️ Paquetes Oracle

```text
PKG_SEGURIDAD
PKG_AFILIADOS
```

### 🏗️ Arquitectura interna

```text
HTTP Request
     │
     ▼
Controller
     │
     ▼
Service
     │
     ▼
Repository
     │
     ▼
Oracle Driver
     │
     ▼
┌─────────────────────┐
│  PKG_SEGURIDAD      │
│  PKG_AFILIADOS      │
└─────────────────────┘
```

### 📁 Estructura

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
│   │   │
│   │   └── affiliates/
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── repositories/
│   │       ├── dto/
│   │       └── mappers/
│   │
│   ├── shared/
│   │   ├── database/
│   │   ├── errors/
│   │   ├── middleware/
│   │   └── config/
│   │
│   └── app/
│
├── test/
├── .env.example
├── package.json
└── README.md
```

---

# ☕ Java — Empresas, Aportes & Historial

### 📦 Responsabilidades

- 🏢 Gestión de empresas
- 💰 Registro y consulta de aportes
- 💼 Historial laboral
- 📊 Consultas relacionadas con aportes

### 🗄️ Paquetes Oracle

```text
PKG_EMPRESAS
PKG_APORTES
PKG_HISTORIAL_LABORAL
```

### 🏗️ Arquitectura interna

```text
HTTP Request
     │
     ▼
Controller
     │
     ▼
Service
     │
     ▼
Repository / DAO
     │
     ▼
JDBC / Oracle
     │
     ▼
┌──────────────────────────────┐
│ PKG_EMPRESAS                 │
│ PKG_APORTES                  │
│ PKG_HISTORIAL_LABORAL        │
└──────────────────────────────┘
```

### 📁 Estructura

```text
backend-java/
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/nutria/
│   │   │       ├── companies/
│   │   │       ├── contributions/
│   │   │       ├── employmenthistory/
│   │   │       └── shared/
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       └── application-dev.yml
│   │
│   └── test/
│
├── pom.xml
├── .env.example
└── README.md
```

---

# 💜 .NET — Pensiones

### 📦 Responsabilidades

- 📄 Gestión de solicitudes de pensión
- 🔎 Validación de requisitos
- 📊 Cálculo de semanas
- 🔄 Gestión de estados
- 📋 Consulta de solicitudes

### 🗄️ Paquete Oracle

```text
PKG_PENSIONES
```

### 🏗️ Arquitectura interna

```text
HTTP Request
     │
     ▼
Controller
     │
     ▼
Application / Service
     │
     ▼
Repository
     │
     ▼
Oracle Provider
     │
     ▼
┌─────────────────────┐
│   PKG_PENSIONES     │
└─────────────────────┘
```

### 📁 Estructura

```text
backend-dotnet/
│
├── src/
│   ├── Api/
│   ├── Application/
│   ├── Domain/
│   └── Infrastructure/
│       └── Oracle/
│
├── tests/
├── appsettings.json
├── appsettings.Development.json
└── README.md
```

---

# ⚠️ PKG_ERRORES

`PKG_ERRORES` es un componente **transversal** de Oracle.

No pertenece exclusivamente a Node.js, Java o .NET.

```text
                       Oracle
                          │
                    PKG_ERRORES
                          ▲
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
           Node.js      Java        .NET
```

### 🎯 Objetivo

Centralizar:

- 🔢 Códigos de error
- 📝 Mensajes
- 🧩 Contexto
- 🚨 Severidad
- 📋 Registro de errores

Esto permite mantener un comportamiento consistente independientemente de qué API origine la operación.

---

# 🚪 API Gateway / BFF

El Gateway/BFF funciona como **punto de entrada para Next.js**.

```text
                         Next.js
                            │
                            ▼
                 ┌────────────────────┐
                 │ API Gateway / BFF   │
                 └─────────┬──────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
      Node.js            Java              .NET
         │                 │                 │
     Seguridad         Empresas          Pensiones
     Afiliados         Aportes
                       Historial
```

### 🛡️ Responsabilidades

| Función | Descripción |
|---|---|
| 🧭 Routing | Enrutamiento hacia el backend correspondiente |
| 🔐 JWT | Validación de autenticación |
| 🚦 Rate Limiting | Control de solicitudes |
| 📋 Logging | Registro de operaciones |
| 📊 Monitoring | Observabilidad |
| 🔄 BFF | Adaptación/composición de respuestas cuando sea necesario |

### 🔗 Rutas conceptuales

```text
/api/security/*
       └──► Node.js

/api/affiliates/*
       └──► Node.js

/api/companies/*
       └──► Java

/api/contributions/*
       └──► Java

/api/employment/*
       └──► Java

/api/pensions/*
       └──► .NET
```

---

# 🗄️ Oracle / PL-SQL

Oracle representa la capa de persistencia y contiene las reglas de negocio implementadas mediante PL/SQL.

### 📦 Paquetes

```text
PKG_SEGURIDAD
PKG_AFILIADOS
PKG_EMPRESAS
PKG_APORTES
PKG_HISTORIAL_LABORAL
PKG_PENSIONES
PKG_ERRORES
```

### 🧱 Otros objetos

```text
database/
│
├── tables/
├── sequences/
├── constraints/
├── triggers/
├── packages/
│   ├── pkg_seguridad/
│   ├── pkg_afiliados/
│   ├── pkg_empresas/
│   ├── pkg_aportes/
│   ├── pkg_historial_laboral/
│   ├── pkg_pensiones/
│   └── pkg_errores/
│
├── seed/
└── scripts/
```

---

# 🔄 Flujo de una operación

Por ejemplo, registrar un afiliado:

```text
                    👤 Usuario
                       │
                       ▼
                   Next.js
                       │
                  POST /api
                       │
                       ▼
              API Gateway / BFF
                       │
                       ▼
                   Node.js
                       │
                       ▼
             AffiliateController
                       │
                       ▼
               AffiliateService
                       │
                       ▼
             AffiliateRepository
                       │
                       ▼
                    Oracle
                       │
                       ▼
       PKG_AFILIADOS.SP_ADD_AFILIADO
                       │
                       ▼
                    Oracle
                       │
                       ▼
                   Node.js
                       │
                       ▼
               Gateway / BFF
                       │
                       ▼
                   Next.js
```

---

# 🔌 Integración con PL/SQL

Los backends **no duplican las reglas de negocio** implementadas en Oracle.

La responsabilidad de cada capa es:

```text
┌────────────────────────────────────┐
│ 🖥️ Next.js                         │
│ Presentación / UX                  │
└─────────────────┬──────────────────┘
                  │
┌─────────────────▼──────────────────┐
│ 🚪 API Gateway / BFF               │
│ Entrada / Seguridad / Routing      │
└─────────────────┬──────────────────┘
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
   🟢 Node     🟠 Java     🟣 .NET
       │          │          │
       └──────────┼──────────┘
                  ▼
┌────────────────────────────────────┐
│ 🔴 Oracle / PL-SQL                 │
│ Reglas de negocio + Persistencia   │
└────────────────────────────────────┘
```

### 🚫 Evitar

```text
Controller
    ↓
SQL
    ↓
Lógica de negocio
```

### ✅ Aplicar

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Oracle Package
    ↓
Procedure / Function
```

---

# 📡 SYS_REFCURSOR

Los procedimientos que devuelven múltiples registros utilizan `SYS_REFCURSOR`.

```text
Oracle
   │
   │ SYS_REFCURSOR
   ▼
Repository / DAO
   │
   ▼
DTO
   │
   ▼
REST Response
   │
   ▼
Next.js
```

Esto permite transformar los resultados de Oracle en respuestas JSON para el frontend.

---

# 🔐 Seguridad

El flujo de autenticación se plantea de la siguiente manera:

```text
👤 Usuario
   │
   ▼
Next.js
   │
   ▼
API Gateway
   │
   ▼
Node.js
   │
   ▼
PKG_SEGURIDAD
   │
   ├── 🔑 Autenticación
   ├── 👤 Usuarios
   ├── 👥 Roles
   └── 🛡️ Permisos
```

Las solicitudes posteriores utilizan **JWT** para mantener el contexto de autenticación.

---

# 🌳 Estructura del repositorio

```text
NUTRIA/
│
├── 📁 frontend/
│   └── Next.js
│
├── 📁 gateway/
│   └── API Gateway / BFF
│
├── 📁 backend-node/
│   └── Seguridad + Afiliados
│
├── 📁 backend-java/
│   └── Empresas + Aportes + Historial
│
├── 📁 backend-dotnet/
│   └── Pensiones
│
├── 📁 database/
│   ├── tables/
│   ├── sequences/
│   ├── constraints/
│   ├── triggers/
│   ├── packages/
│   └── seed/
│
├── 📁 docs/
│   └── architecture.png
│
├── 📄 .gitignore
└── 📄 README.md
```

---

# 🧰 Stack tecnológico

<div align="center">

| 🧩 Capa | 🛠️ Tecnología |
|---|---|
| 🎨 Frontend | **Next.js** |
| 🚪 Gateway | **API Gateway / BFF** |
| 🟢 API Seguridad | **Node.js** |
| 🟠 API Empresas | **Java + Spring Boot** |
| 🟣 API Pensiones | **ASP.NET Core** |
| 🔴 Database | **Oracle** |
| 📜 Database Logic | **PL/SQL** |
| 🔐 Authentication | **JWT** |
| 🌐 Communication | **REST / HTTPS** |
| 📦 Version Control | **Git** |

</div>

---

# 🚀 Orden de implementación

### 1️⃣ Base de datos

```text
Tablas
   ↓
Constraints
   ↓
Sequences
   ↓
Packages
   ↓
Triggers
   ↓
Datos iniciales
```

### 2️⃣ Node.js

```text
PKG_SEGURIDAD
      ↓
API Seguridad
      ↓
PKG_AFILIADOS
      ↓
API Afiliados
```

### 3️⃣ Java

```text
PKG_EMPRESAS
PKG_APORTES
PKG_HISTORIAL_LABORAL
          ↓
    Spring Boot API
```

### 4️⃣ .NET

```text
PKG_PENSIONES
      ↓
ASP.NET Core API
```

### 5️⃣ Gateway

```text
Next.js
   ↓
API Gateway / BFF
   ↓
Node.js / Java / .NET
```

### 6️⃣ Frontend

```text
Next.js
   ↓
Integración con APIs
   ↓
Módulos funcionales
```

---

# 🌱 Git Flow

Se recomienda utilizar ramas por funcionalidad:

```text
main
 │
 └── develop
       │
       ├── feature/node-afiliados
       ├── feature/node-seguridad
       ├── feature/java-aportes
       ├── feature/java-empresas
       ├── feature/java-historial
       ├── feature/dotnet-pensiones
       └── feature/oracle-packages
```

### 📝 Convención sugerida

```text
feature/
fix/
hotfix/
refactor/
docs/
test/
```

Ejemplos:

```text
feature/add-affiliate-api
feature/create-pension-api
fix/oracle-refcursor
docs/update-architecture
test/affiliate-service
```

---

# 🔑 Variables de entorno

Las credenciales **nunca deben almacenarse directamente en Git**.

### Oracle

```env
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=YOUR_SERVICE
ORACLE_USER=YOUR_USER
ORACLE_PASSWORD=YOUR_PASSWORD
```

### Gateway

```env
NODE_API_URL=http://localhost:3001
JAVA_API_URL=http://localhost:8080
DOTNET_API_URL=http://localhost:5000
JWT_SECRET=YOUR_SECRET
```

Mantener únicamente:

```text
.env.example
```

en el repositorio.

---

# 📊 Principios arquitectónicos

| 🎯 Principio | Aplicación |
|---|---|
| 🧩 Separación de responsabilidades | Cada servicio tiene un dominio definido |
| 📦 Modularidad | Cada backend se organiza por dominio |
| 🔐 Seguridad | JWT + roles + permisos |
| 🗄️ Centralización de negocio | Reglas principales en PL/SQL |
| 🔄 Reutilización | Paquetes Oracle consumidos por las APIs |
| 📈 Escalabilidad | Servicios independientes |
| 🧪 Testabilidad | Controllers, Services y Repositories separados |
| 📋 Observabilidad | Logging y monitoring desde Gateway/APIs |

---

# 🧭 Mapa de dominios

```text
                         NUTRIA
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      SEGURIDAD         OPERACIONES       PENSIONES
          │                │                │
          │         ┌──────┼──────┐         │
          │         │      │      │         │
          ▼         ▼      ▼      ▼         ▼
       Usuarios  Empresas Aportes Historial Solicitudes
       Roles
       Permisos
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                        Oracle
```

---

# 🏁 Estado del proyecto

> 🟡 **En desarrollo**

### Próximos pasos

- [ ] 🗄️ Crear estructura Oracle
- [ ] 📦 Implementar paquetes PL/SQL
- [ ] 🟢 Crear backend Node.js
- [ ] 🟠 Crear backend Java
- [ ] 🟣 Crear backend .NET
- [ ] 🚪 Implementar API Gateway/BFF
- [ ] 🎨 Crear frontend Next.js
- [ ] 🔐 Implementar autenticación JWT
- [ ] 🧪 Implementar pruebas
- [ ] 📊 Implementar logging y monitoreo
- [ ] 🐳 Containerización
- [ ] 🚀 Despliegue

---

<div align="center">

### 💻 NUTRIA

**Next.js · Node.js · Java · .NET · Oracle PL/SQL**

<br>

_Arquitectura distribuida orientada a dominios_

</div>
