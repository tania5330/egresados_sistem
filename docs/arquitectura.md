# Arquitectura del Sistema de Egresados y Oferta Laboral

## Diagrama de Arquitectura General

```mermaid
graph TB
    subgraph "Capa de Presentación (Client)"
        Browser[("Navegador Web")]
    end

    subgraph "Frontend - Next.js 15/16 (App Router)"
        direction TB
        NextJS["Next.js Server Components"]
        ClientComp["Client Components (React 19)"]
        TRPCClient["tRPC Client"]
        Tailwind["Tailwind CSS + shadcn/ui"]
        Recharts["Recharts / Tremor.so"]
    end

    subgraph "API Layer - tRPC"
        TRPCRouter["tRPC Router"]
        TRPCMiddleware["Middleware (Auth, Validation)"]
    end

    subgraph "Backend - NestJS"
        direction TB
        NestApp["NestJS Application"]
        AuthModule["Módulo de Auth"]
        EgresadosModule["Módulo de Egresados"]
        OfertasModule["Módulo de Ofertas"]
        DashboardModule["Módulo de Dashboard"]
        ReportesModule["Módulo de Reportes"]
        NotificacionesModule["Módulo de Notificaciones"]

        subgraph "Seguridad"
            JWTAuthGuard["JWT Auth Guard"]
            RolesGuard["RBAC Roles Guard"]
        end

        subgraph "Queue System"
            BullMQ["BullMQ Queue"]
            Worker["Worker Process"]
        end
    end

    subgraph "Data Layer"
        PostgreSQL["PostgreSQL 15+"]
        RedisCache["Redis (Cache)"]
        S3Storage["S3 / File Storage (PDFs)"]
    end

    subgraph "Infraestructura"
        Vercel["Vercel (Frontend)"]
        Cloudflare["Cloudflare Workers (Backend)"]
        GHA["GitHub Actions CI/CD"]
    end

    Browser -->|HTTPS| NextJS
    NextJS -->|Server Components| ClientComp
    ClientComp -->|tRPC Query/Mutation| TRPCClient
    TRPCClient -->|HTTP/s| TRPCRouter
    TRPCRouter -->|Validate| TRPCMiddleware
    TRPCMiddleware -->|Auth Check| JWTAuthGuard
    TRPCMiddleware -->|Role Check| RolesGuard
    JWTAuthGuard -->|Request| NestApp
    RolesGuard -->|Request| NestApp

    NestApp -->|Dependency Injection| AuthModule
    NestApp -->|Dependency Injection| EgresadosModule
    NestApp -->|Dependency Injection| OfertasModule
    NestApp -->|Dependency Injection| DashboardModule
    NestApp -->|Dependency Injection| ReportesModule
    NestApp -->|Dependency Injection| NotificacionesModule

    ReportesModule -->|Enqueue Job| BullMQ
    BullMQ -->|Process| Worker
    Worker -->|Generate PDF| S3Storage
    Worker -->|Cache Stats| RedisCache

    NestApp -->|CRUD Operations| PostgreSQL
    DashboardModule -->|Read Aggregations| PostgreSQL
    DashboardModule -->|Cache Hits| RedisCache

    AuthModule -->|Validate Credentials| PostgreSQL
    NotificacionesModule -->|Send Emails| SMTPService["SMTP Service"]

    NextJS -->|Static Assets| Vercel
    Vercel -->|Serverless Functions| Cloudflare

    GHA -->|Deploy| Vercel
    GHA -->|Deploy| Cloudflare
    GHA -->|CI Pipeline| NestApp
    GHA -->|CI Pipeline| NextJS
```

## Diagrama de Flujo de Datos

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (Next.js)
    participant T as tRPC Router
    participant B as Backend (NestJS)
    participant Q as BullMQ Queue
    participant W as Worker
    participant D as PostgreSQL
    participant R as Redis
    participant S as Storage

    U->>F: Request (Login/Query/Mutation)
    F->>T: tRPC Call
    T->>B: Route to Module

    alt Authentication Flow
        B->>D: Validate User
        D-->>B: User Data
        B->>R: Create Session
        R-->>B: Session Token
        B-->>F: JWT Token
    end

    alt CRUD Operations
        B->>D: Execute Query
        D-->>B: Result
        B-->>F: Response
        F-->>U: Render UI
    end

    alt Report Generation (Async)
        F->>T: Request Report Generation
        T->>B: Enqueue Job
        B-->>F: Job ID
        F->>F: Poll Status
        Q->>W: Process Job
        W->>D: Fetch Data
        W->>W: Generate PDF
        W->>S: Store PDF
        S-->>W: PDF URL
        W-->>Q: Job Complete
        F->>T: Get Report URL
        T->>S: Get PDF URL
        S-->>T: PDF URL
        T-->>F: Download Link
        F-->>U: Download PDF
    end

    alt Dashboard Analytics
        F->>T: Fetch Dashboard Data
        T->>B: Query Stats
        B->>R: Check Cache
        alt Cache Hit
            R-->>B: Cached Data
        else Cache Miss
            B->>D: Aggregate Query
            D-->>B: Aggregated Data
            B->>R: Store in Cache
        end
        B-->>F: Dashboard Data
        F->>F: Render Charts
    end
```

## Diagrama de Arquitectura de Módulos NestJS

```mermaid
graph TB
    subgraph "NestJS Application"
        AppModule["AppModule"]
        ConfigModule["ConfigModule"]

        subgraph "Core Modules"
            AuthModule["AuthModule"]
            UsersModule["UsersModule"]
        end

        subgraph "Business Modules"
            EgresadosModule["EgresadosModule"]
            OfertasModule["OfertasModule"]
            PostulacionesModule["PostulacionesModule"]
            DashboardModule["DashboardModule"]
            ReportesModule["ReportesModule"]
            NotificacionesModule["NotificacionesModule"]
        end

        subgraph "Shared Services"
            DatabaseService["DatabaseService (Prisma)"]
            CacheService["CacheService (Redis)"]
            QueueService["QueueService (BullMQ)"]
            EmailService["EmailService"]
            StorageService["StorageService (S3)"]
            PdfService["PdfService (Puppeteer)"]
        end
    end

    subgraph "tRPC Integration"
        TRPCModule["TRPCModule"]
        TRPCRouters["TRPCRouters"]
        TRPCContext["TRPCContext"]
    end

    subgraph "Security Layer"
        JwtStrategy["JwtStrategy"]
        JwtAuthGuard["JwtAuthGuard"]
        RolesGuard["RolesGuard"]
        ThrottlerGuard["ThrottlerGuard"]
    end

    AppModule --> ConfigModule
    AppModule --> TRPCModule

    TRPCModule --> TRPCRouters
    TRPCContext --> JwtStrategy

    AuthModule --> JwtAuthGuard
    AuthModule --> UsersModule

    EgresadosModule --> DatabaseService
    OfertasModule --> DatabaseService
    PostulacionesModule --> DatabaseService

    DashboardModule --> DatabaseService
    DashboardModule --> CacheService

    ReportesModule --> QueueService
    ReportesModule --> PdfService
    ReportesModule --> StorageService

    NotificacionesModule --> EmailService

    TRPCRouters --> AuthModule
    TRPCRouters --> EgresadosModule
    TRPCRouters --> OfertasModule
    TRPCRouters --> PostulacionesModule
    TRPCRouters --> DashboardModule
    TRPCRouters --> ReportesModule
    TRPCRouters --> NotificacionesModule
```

## Diagrama de Despliegue

```mermaid
flowchart LR
    subgraph "Development"
        Dev["Desarrollo Local"]
        DockerDev["Docker Compose\n(PostgreSQL + Redis + Server + Web)"]
    end

    subgraph "CI/CD Pipeline"
        Git["Git Push"]
        GHA["GitHub Actions"]
        Test["Tests\n(Vitest + Playwright)"]
        Build["Build\n(Docker Images)"]
        Deploy["Deploy"]
    end

    subgraph "Staging/Production"
        Registry["Container Registry"]
        Vercel["Vercel (Frontend)"]
        Cloudflare["Cloudflare Workers (Backend)"]
        Supabase["Supabase (PostgreSQL)"]
        Upstash["Upstash (Redis)"]
    end

    Dev --> Git
    Git --> GHA
    GHA --> Test
    Test --> Build
    Build --> Registry
    Registry --> Deploy

    Deploy --> Vercel
    Deploy --> Cloudflare
    Cloudflare --> Supabase
    Cloudflare --> Upstash
```

## Diagrama de Flujo de Autenticación y Autorización

```mermaid
sequenceDiagram
    participant C as Cliente
    participant F as Frontend
    participant T as tRPC
    participant A as Auth Module
    participant D as Database
    participant R as Redis

    C->>F: Login Request (email, password)
    F->>T: mutation auth.login({ email, password })
    T->>A: validateUser(email, password)
    A->>D: SELECT user WHERE email = ?
    D-->>A: User record
    A->>A: bcrypt.compare(password, hash)
    alt Invalid credentials
        A-->>T: UnauthorizedException
        T-->>F: { error: "Credenciales inválidas" }
        F-->>C: Show error
    else Valid credentials
        A->>A: Generate JWT payload
        A->>R: Store refresh token
        R-->>A: Token stored
        A-->>T: { accessToken, refreshToken, user }
        T-->>F: { accessToken, refreshToken, user }
        F->>F: Store tokens in memory/storage
        F-->>C: Redirect to Dashboard
    end

    C->>F: Request Protected Resource
    F->>T: query protectedResource({ ... })
    T->>A: Verify JWT
    A->>A: jwt.verify(token)
    alt Invalid/Expired token
        A-->>T: UnauthorizedException
        T-->>F: Redirect to Login
    else Valid token
        A-->>T: User context
        T->>T: Check RBAC permissions
        alt Insufficient permissions
            T-->>F: ForbiddenException
            F-->>C: Show "Access Denied"
        else Has permission
            T->>D: Fetch resource
            D-->>T: Resource data
            T-->>F: Resource response
            F-->>C: Render resource
        end
    end
```