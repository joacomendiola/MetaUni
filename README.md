# 🎓 MetaUni

**Tracker gamificado del progreso académico universitario.** Registrá tu carrera, cargá tus materias con estado y nota, sumá XP, subí de nivel, mantené tu racha y desbloqueá logros mientras avanzás hacia el título.

Monorepo full-stack **TypeScript** con API REST, PostgreSQL y SPA en React.

<p>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" />
  <img alt="Node" src="https://img.shields.io/badge/Node-22-339933?logo=node.js&logoColor=white" />
  <img alt="Fastify" src="https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" />
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white" />
</p>

---

## ✨ Características

- **Autenticación JWT** con access token + refresh token rotativo en cookie `httpOnly`.
- **Carreras personales** y **catálogo oficial** de carreras (clonables con un clic).
- **Materias** con estados reales (`PENDIENTE`, `CURSANDO`, `REGULAR`, `APROBADA`), nota, año, cuatrimestre y créditos.
- **Gamificación**: XP por estado/nota, niveles con costos crecientes, racha diaria y 10 logros.
- **Dashboard** con progreso visual, promedio, distribución de estados y notas (Recharts).
- **Panel de administración**: usuarios, roles y catálogo de carreras con sus materias.
- **Dark mode**, diseño responsive y componentes estilo shadcn/ui.
- **Tipos y validaciones compartidas** entre API y web vía `shared/` (Zod).
- **Tests** de reglas de gamificación y validaciones con Vitest.
- **CI** con GitHub Actions y blueprint de despliegue para Render.

---

## 📂 Estructura del monorepo

```text
metauni/
├── backend/                     # Fastify + Prisma + PostgreSQL
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── src/
│       ├── lib/                 # errors, validation, tokens, mappers
│       ├── routes/              # auth, users, careers, subjects, stats, admin
│       ├── services/            # gamification, achievements
│       ├── types/
│       ├── app.ts
│       └── server.ts
├── frontend/                    # React 19 + Vite + Tailwind v4
│   └── src/
│       ├── components/          # UI, AppShell, diálogos, etc.
│       ├── context/             # AuthContext
│       ├── hooks/
│       ├── lib/                 # api client, queries, utils
│       └── pages/               # Login, Register, Dashboard, Careers...
├── shared/                      # tipos, schemas Zod y reglas de XP
├── docker-compose.yml
├── render.yaml
└── .github/workflows/ci.yml
```

---

## 🏗️ Stack

| Capa | Tecnología |
|------|------------|
| API | Fastify 5, `@fastify/jwt`, `@fastify/cookie`, `@fastify/cors` |
| ORM / DB | Prisma 6 + PostgreSQL 16 |
| Auth | JWT access (15m) + refresh rotativo (cookie httpOnly, path `/api/auth`) |
| Validación | Zod (schemas compartidos) |
| Web | React 19, Vite 7, React Router 7 |
| Datos cliente | TanStack Query 5, Axios |
| UI | Tailwind CSS 4, componentes estilo shadcn/ui, Radix, Lucide, Recharts, Sonner |
| Tests / CI | Vitest + GitHub Actions |

---

## 🚀 Puesta en marcha

### Requisitos

- Node.js **20+** (probado con 22)
- Docker Desktop (para PostgreSQL)
- npm (workspaces)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

```bash
# Windows PowerShell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

> El `docker-compose.yml` expone PostgreSQL en **localhost:55432** para no chocar con una instalación local de Postgres en el puerto 5432. Si preferís otro puerto, cambialo en `docker-compose.yml` y en `DATABASE_URL`.

### 3. Levantar PostgreSQL y preparar la base

```bash
npm run db:up          # docker compose up -d
npm run db:generate    # prisma generate
npm run db:migrate     # aplica migraciones
npm run db:seed        # logros + catálogo + usuarios demo
```

### 4. Desarrollo

```bash
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000
- Health check: http://localhost:4000/api/health

El frontend usa un **proxy de Vite** (`/api` → `http://localhost:4000`), por lo que las cookies de refresh funcionan en desarrollo sin configuración extra.

### Cuentas demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Estudiante | `demo@metauni.app` | `demo123` |
| Administrador | `admin@metauni.app` | `admin123` |

---

## 🧰 Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | API + Web en paralelo |
| `npm run dev:api` / `npm run dev:web` | Levantar solo un servicio |
| `npm run build` | Build de shared + api (tsup) + web (Vite) |
| `npm run typecheck` | Chequeo de tipos de API y Web |
| `npm test` | Tests de Vitest |
| `npm run db:up` / `db:down` | Iniciar / detener PostgreSQL |
| `npm run db:generate` | Generar Prisma Client |
| `npm run db:migrate` | Crear/aplicar migraciones |
| `npm run db:push` | Sincronizar esquema sin migración |
| `npm run db:seed` | Cargar logros, catálogo y usuarios demo |
| `npm run db:studio` | Prisma Studio |

---

## 🧠 Modelo de dominio

```text
User ─┬─< Career ─< Subject
      ├─< UserAchievement >─ Achievement
      └─< RefreshToken
```

- **Career** puede ser personal (`ownerId`) o de catálogo (`isCatalog = true`, `ownerId = null`).
- Al agregar una carrera del catálogo se **clona** con sus materias en estado `PENDIENTE`.
- **Subject** guarda `xpAwarded` para calcular deltas de XP cuando cambia estado/nota (evita farmear alternando estados).
- **Achievement** se define una vez y se relaciona con usuarios vía `UserAchievement`.

### Reglas de XP

| Estado | XP base | Bonus por nota |
|--------|---------|----------------|
| `PENDIENTE` | 0 | — |
| `CURSANDO` | 20 | — |
| `REGULAR` | 60 | — |
| `APROBADA` | 100 | `+ nota × 10` |

- Nivel: costo creciente `100 + (nivel − 1) × 50` XP.
- Racha: se actualiza por actividad diaria (login, alta de carreras y alta/edición de materias); se corta si pasa más de un día.
- Logros: primer aprobado, 10/25 aprobadas, 50% de carrera, carrera completa, rachas de 7/30 días, nota 10, niveles 5/10.

---

## 🔗 API REST

Todas las rutas (salvo auth/health) requieren `Authorization: Bearer <accessToken>`.

### Auth — `/api/auth`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/register` | Registro + tokens |
| POST | `/login` | Login + tokens |
| POST | `/refresh` | Rota refresh cookie y devuelve access token |
| POST | `/logout` | Revoca refresh token y limpia cookie |
| GET | `/me` | Usuario autenticado |

### Usuarios — `/api/users`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/me` | Perfil público |
| PATCH | `/me` | Editar nombre, email, avatar o contraseña |

### Carreras — `/api/careers`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Mis carreras con progreso |
| GET | `/catalog` | Carreras de catálogo |
| GET | `/:id` | Detalle con materias |
| POST | `/` | Crear carrera personal |
| POST | `/from-catalog/:id` | Clonar carrera del catálogo |
| PATCH | `/:id` | Editar carrera |
| DELETE | `/:id` | Eliminar carrera |

### Materias — `/api`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/careers/:careerId/subjects` | Materias de una carrera |
| POST | `/careers/:careerId/subjects` | Crear materia (suma XP) |
| PATCH | `/subjects/:id` | Editar materia / estado (delta de XP) |
| DELETE | `/subjects/:id` | Eliminar materia (descuenta XP) |

### Estadísticas — `/api/stats`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/overview` | Dashboard completo (totales, promedios, racha, logros) |
| GET | `/achievements` | Logros desbloqueados |

### Admin — `/api/admin` (rol `ADMIN`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/overview` | Métricas globales |
| GET | `/users` | Listar usuarios |
| PATCH | `/users/:id` | Editar nombre/rol |
| DELETE | `/users/:id` | Eliminar usuario |
| GET | `/careers` | Catálogo con materias |
| POST | `/careers` | Crear carrera de catálogo |
| PATCH | `/careers/:id` | Editar carrera de catálogo |
| DELETE | `/careers/:id` | Eliminar carrera de catálogo |
| POST | `/careers/:id/subjects` | Agregar materia al catálogo |
| PATCH | `/subjects/:id` | Editar materia de catálogo |
| DELETE | `/subjects/:id` | Eliminar materia de catálogo |

### Ejemplo

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "demo@metauni.app", "password": "demo123" }
```

```http
POST /api/careers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Ingeniería en Sistemas",
  "faculty": "Ingeniería",
  "totalSubjects": 40,
  "color": "#6366f1"
}
```

---

## 🧪 Tests

```bash
npm test
```

Cubren XP por estado/nota, cálculo de niveles, porcentajes, normalización de notas y schemas de validación.

---

## ☁️ Despliegue en Render

El archivo `render.yaml` define:

- **PostgreSQL** gestionado (`metauni-db`).
- **API** en Node con migraciones automáticas (`prisma migrate deploy`) y health check `/api/health`.
- **Web** como sitio estático con rewrite SPA a `index.html` y `VITE_API_URL` apuntando a la API.

Pasos:

1. Subí el repo a GitHub.
2. En Render → **New → Blueprint** → seleccioná el repo.
3. Ajustá `CORS_ORIGIN` y `VITE_API_URL` si cambiás los nombres de los servicios.
4. Configurá `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` (el blueprint los genera).
5. En producción las cookies usan `SameSite=None; Secure`, así que ambos servicios deben servirse por **HTTPS**.

---

## 🔐 Seguridad

- Contraseñas con **bcrypt** (10 rondas).
- Access tokens cortos y refresh tokens **hasheados** (SHA-256) en base de datos, con rotación y revocación.
- Ownership check en carreras/materias (solo el dueño accede).
- Roles `STUDENT` / `ADMIN` con guardas en rutas admin.
- Validación de entrada con Zod y manejo centralizado de errores.

---

## 👨‍💻 Autor

Desarrollado por **Joaquín Mendiola** · [GitHub @joacomendiola](https://github.com/joacomendiola)

> Proyecto personal para acompañar a estudiantes a visualizar su progreso académico de forma motivadora.
