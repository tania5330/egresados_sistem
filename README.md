# Sistema de Gestión de Egresados y Oferta Laboral

Sistema web empresarial para la gestión de egresados y oferta laboral con dashboards analíticos y generación de reportes.

## 🏗️ Arquitectura

El sistema sigue una arquitectura monorepo con workspaces:

```
proyecto/
├── packages/
│   ├── server/          # Backend NestJS + tRPC
│   ├── web/             # Frontend Next.js 15/16
│   └── shared/          # Tipos compartidos
├── docker/              # Configuración Docker
├── docs/                # Diagramas y documentación
└── .github/workflows/   # CI/CD
```

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15/16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS + shadcn/ui**
- **tRPC** (tipo seguro E2E)
- **Recharts** (visualización de datos)
- **React Hook Form + Zod** (formularios)

### Backend
- **NestJS** (módulos, DI, guards)
- **tRPC** (API layer)
- **Prisma** (ORM)
- **PostgreSQL 15+**
- **Redis** (cache + BullMQ)
- **BullMQ** (cola de trabajos)

### Infraestructura
- **Docker** + docker-compose
- **GitHub Actions** (CI/CD)
- **Vercel** (frontend)
- **Cloudflare Workers** (backend)

## 📦 Módulos Funcionales

### 1. Módulo de Autenticación y Roles
- Registro/Login con email/password
- JWT con access + refresh tokens
- Roles: ADMIN, EGRESADO, EMPRESA
- RBAC con guards decorados

### 2. Módulo de Egresados
- Perfil completo (datos personales, formación, experiencia)
- Gestión de habilidades (N:N con nivel)
- Búsqueda y filtrado avanzado
- CRUD con permisos por rol

### 3. Módulo de Oferta Laboral
- CRUD ofertas (EMPRESA crea, ADMIN gestiona)
- Postulación de egresados
- Historial de estados
- Filtros múltiples

### 4. Módulo de Dashboard
- **Admin**: KPIs, gráficos de evolución, distribución, demanda habilidades
- **Egresado**: stats personales, ofertas recomendadas
- **Empresa**: rendimiento ofertas, candidatos destacados

### 5. Módulo de Reportes
- Generación async con BullMQ
- 6 tipos de reportes configurables
- Filtros dinámicos
- Descarga de PDFs

## 🚀 Inicio Rápido

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- PostgreSQL 15+ (o usar docker-compose)
- Redis (o usar docker-compose)

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd proyecto

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar con Docker
docker-compose -f docker/docker-compose.yml up -d

# O ejecutar localmente:
# Backend
cd packages/server
npm install
npm run start:dev

# Frontend (en otra terminal)
cd packages/web
npm install
npm run dev
```

### Variables de Entorno

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/egresados

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# URLs
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

## 📊 Dashboard

### Admin Dashboard
- Tarjetas KPI: total egresados, empresas, ofertas activas, tasa empleabilidad
- Gráfico de ofertas vs postulaciones por mes
- Distribución de egresados por carrera
- Demanda de habilidades
- Tasa de contratación por cohorte
- Mapa de calor ubicación

### Dashboard Egresado
- Mis postulaciones y estados
- Ofertas recomendadas basadas en perfil
- Tasa de respuesta

### Dashboard Empresa
- Ofertas publicadas
- Postulaciones recibidas
- Rendimiento por oferta
- Candidatos destacados

## 📄 Generación de Reportes

Tipos disponibles:
1. `LISTADO_EGRESADOS` - Exportar egresados con filtros
2. `LISTADO_OFERTAS` - Ofertas activas con detalle
3. `POSTULACIONES_POR_OFERTA` - Postulaciones específicas
4. `REPORTE_EMPLEABILIDAD` - % empleados por carrera/año
5. `REPORTE_DEMANDA_LABORAL` - Top habilidades/sectores
6. `REPORTE_COMPARATIVO_COHORTE` - Comparación año vs año

Flujo:
1. Seleccionar tipo de reporte
2. Llenar filtros (fechas, carreras, etc.)
3. Generar (proceso async en cola)
4. Descargar cuando esté listo

## 🧪 Testing

```bash
# Unit tests (Vitest)
npm run test

# Tests de componentes
npm run test:web

# E2E (Playwright)
npm run test:e2e
```

## 🔒 Seguridad

- Passwords hasheados con bcrypt (10 rounds)
- JWT con expiración corta (15min access, 7d refresh)
- RBAC con guards a nivel de método
- Validación de inputs con class-validator/zod
- Auditoría con logs de todas las operaciones

## 📈 Escalabilidad

- Vistas materializadas para dashboards (refresh async)
- Cache en Redis (5min general, 1min user-specific)
- Cola BullMQ para procesos pesados (reports)
- Índices optimizados para consultas analíticas

## 🎨 UI/UX

- shadcn/ui components (Radix primitives)
- Tailwind CSS con variables CSS custom
- Recharts para visualización
- Responsive design
- Loading states con skeletons
- Empty states informativos

## 📝 Licencia

MIT