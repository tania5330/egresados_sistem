-- ============================================================
-- SISTEMA DE EGRESADOS Y OFERTA LABORAL
-- Script SQL para PostgreSQL 15+
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('ADMIN', 'EGRESADO', 'EMPRESA');
CREATE TYPE genero AS ENUM ('M', 'F', 'O');
CREATE TYPE nivel_habilidad AS ENUM ('BASICO', 'INTERMEDIO', 'AVANZADO', 'EXPERTO');
CREATE TYPE tipo_habilidad AS ENUM ('TECNICA', 'BLANDA');
CREATE TYPE modalidad_oferta AS ENUM ('PRESENCIAL', 'REMOTO', 'HIBRIDO');
CREATE TYPE tipo_contrato AS ENUM ('TIEMPO_COMPLETO', 'PARCIAL', 'POR_HORA', 'PROYECTO');
CREATE TYPE estado_postulacion AS ENUM ('POSTULADO', 'EN_REVISION', 'ENTREVISTA', 'CONTRATADO', 'RECHAZADO');
CREATE TYPE estado_reporte AS ENUM ('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR');

-- ============================================================
-- TABLAS BASE
-- ============================================================

-- Tabla de usuarios (base para todos los roles)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'EGRESADO',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla de egresados
CREATE TABLE egresados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    fecha_nacimiento DATE,
    foto_url VARCHAR(500),
    cv_url VARCHAR(500),
    biografia TEXT,
    genero genero,
    buscando_empleo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla de empresas
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    nit VARCHAR(50) NOT NULL UNIQUE,
    sector VARCHAR(100),
    telefono VARCHAR(50),
    direccion TEXT,
    logo_url VARCHAR(500),
    descripcion TEXT,
    ciudad VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Colombia',
    verificada BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLAS DE PERFIL Y FORMACIÓN
-- ============================================================

-- Formación académica del egresado
CREATE TABLE formacion_academica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    egresado_id UUID NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
    institucion VARCHAR(255) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    carrera VARCHAR(255),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    culminada BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Experiencia laboral del egresado
CREATE TABLE experiencia_laboral (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    egresado_id UUID NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
    empresa VARCHAR(255) NOT NULL,
    cargo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    trabajo_actual BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Catálogo de habilidades
CREATE TABLE habilidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    tipo tipo_habilidad NOT NULL,
    categoria VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Relación many-to-many entre egresados y habilidades
CREATE TABLE egresado_habilidad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    egresado_id UUID NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
    habilidad_id UUID NOT NULL REFERENCES habilidades(id) ON DELETE CASCADE,
    nivel nivel_habilidad NOT NULL DEFAULT 'INTERMEDIO',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(egresado_id, habilidad_id)
);

-- ============================================================
-- TABLAS DE OFERTAS Y POSTULACIONES
-- ============================================================

-- Ofertas laborales
CREATE TABLE ofertas_laborales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    requisitos TEXT,
    beneficios TEXT,
    modalidad modalidad_oferta NOT NULL DEFAULT 'PRESENCIAL',
    tipo_contrato tipo_contrato NOT NULL DEFAULT 'TIEMPO_COMPLETO',
    salario_min DECIMAL(12, 2),
    salario_max DECIMAL(12, 2),
    moneda VARCHAR(10) DEFAULT 'COP',
    ciudad VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Colombia',
    activa BOOLEAN NOT NULL DEFAULT true,
    plazas_disponibles INTEGER NOT NULL DEFAULT 1,
    fecha_cierre DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilidades requeridas por oferta
CREATE TABLE oferta_habilidad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oferta_id UUID NOT NULL REFERENCES ofertas_laborales(id) ON DELETE CASCADE,
    habilidad_id UUID NOT NULL REFERENCES habilidades(id) ON DELETE CASCADE,
    obligatoria BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(oferta_id, habilidad_id)
);

-- Postulaciones
CREATE TABLE postulaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oferta_id UUID NOT NULL REFERENCES ofertas_laborales(id) ON DELETE CASCADE,
    egresado_id UUID NOT NULL REFERENCES egresados(id) ON DELETE CASCADE,
    estado estado_postulacion NOT NULL DEFAULT 'POSTULADO',
    carta_presentacion TEXT,
    fecha_postulacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(oferta_id, egresado_id)
);

-- Historial de cambios de estado en postulaciones
CREATE TABLE postulacion_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    postulacion_id UUID NOT NULL REFERENCES postulaciones(id) ON DELETE CASCADE,
    estado_anterior estado_postulacion,
    estado_nuevo estado_postulacion NOT NULL,
    comentario TEXT,
    cambiado_por UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLAS DEL SISTEMA
-- ============================================================

-- Notificaciones
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    datos_adicionales JSONB,
    leida BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Reportes generados
CREATE TABLE reportes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    parametros JSONB,
    archivo_url VARCHAR(500),
    estado estado_reporte NOT NULL DEFAULT 'PENDIENTE',
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    error_mensaje TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Logs de auditoría
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(100) NOT NULL,
    entidad_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLAS DE CATÁLOGO
-- ============================================================

-- Facultades
CREATE TABLE facultades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Carreras
CREATE TABLE carreras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    facultad_id UUID REFERENCES facultades(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Añadir referencia de carrera a formacion_academica
ALTER TABLE formacion_academica ADD COLUMN IF NOT EXISTS carrera_id UUID REFERENCES carreras(id) ON DELETE SET NULL;

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Índices para users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Índices para egresados
CREATE INDEX idx_egresados_user_id ON egresados(user_id);
CREATE INDEX idx_egresados_nombres ON egresados(nombres);
CREATE INDEX idx_egresados_apellidos ON egresados(apellidos);
CREATE INDEX idx_egresados_buscando_empleo ON egresados(buscando_empleo);

-- Índices para empresas
CREATE INDEX idx_empresas_user_id ON empresas(user_id);
CREATE INDEX idx_empresas_nit ON empresas(nit);
CREATE INDEX idx_empresas_sector ON empresas(sector);
CREATE INDEX idx_empresas_ciudad ON empresas(ciudad);
CREATE INDEX idx_empresas_pais ON empresas(pais);

-- Índices para formación académica
CREATE INDEX idx_formacion_egresado_id ON formacion_academica(egresado_id);
CREATE INDEX idx_formacion_carrera_id ON formacion_academica(carrera_id);
CREATE INDEX idx_formacion_institucion ON formacion_academica(institucion);

-- Índices para experiencia laboral
CREATE INDEX idx_experiencia_egresado_id ON experiencia_laboral(egresado_id);
CREATE INDEX idx_experiencia_empresa ON experiencia_laboral(empresa);

-- Índices para habilidades
CREATE INDEX idx_habilidades_nombre ON habilidades(nombre);
CREATE INDEX idx_habilidades_tipo ON habilidades(tipo);

-- Índices para egresado_habilidad
CREATE INDEX idx_egresado_habilidad_egresado_id ON egresado_habilidad(egresado_id);
CREATE INDEX idx_egresado_habilidad_habilidad_id ON egresado_habilidad(habilidad_id);

-- Índices para ofertas laborales
CREATE INDEX idx_ofertas_empresa_id ON ofertas_laborales(empresa_id);
CREATE INDEX idx_ofertas_activa ON ofertas_laborales(activa) WHERE activa = true;
CREATE INDEX idx_ofertas_fecha_cierre ON ofertas_laborales(fecha_cierre) WHERE fecha_cierre IS NOT NULL;
CREATE INDEX idx_ofertas_ciudad ON ofertas_laborales(ciudad);
CREATE INDEX idx_ofertas_pais ON ofertas_laborales(pais);
CREATE INDEX idx_ofertas_modalidad ON ofertas_laborales(modalidad);
CREATE INDEX idx_ofertas_salario ON ofertas_laborales(salario_min, salario_max);
CREATE INDEX idx_ofertas_tipo_contrato ON ofertas_laborales(tipo_contrato);
CREATE INDEX idx_ofertas_created_at ON ofertas_laborales(created_at DESC);

-- Índices para oferta_habilidad
CREATE INDEX idx_oferta_habilidad_oferta_id ON oferta_habilidad(oferta_id);
CREATE INDEX idx_oferta_habilidad_habilidad_id ON oferta_habilidad(habilidad_id);

-- Índices para postulaciones
CREATE INDEX idx_postulaciones_oferta_id ON postulaciones(oferta_id);
CREATE INDEX idx_postulaciones_egresado_id ON postulaciones(egresado_id);
CREATE INDEX idx_postulaciones_estado ON postulaciones(estado);
CREATE INDEX idx_postulaciones_fecha ON postulaciones(fecha_postulacion DESC);

-- Índices para postulacion_historial
CREATE INDEX idx_postulacion_historial_postulacion_id ON postulacion_historial(postulacion_id);
CREATE INDEX idx_postulacion_historial_fecha ON postulacion_historial(created_at DESC);

-- Índices para notificaciones
CREATE INDEX idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida) WHERE leida = false;
CREATE INDEX idx_notificaciones_created_at ON notificaciones(created_at DESC);

-- Índices para reportes
CREATE INDEX idx_reportes_usuario_id ON reportes(usuario_id);
CREATE INDEX idx_reportes_tipo ON reportes(tipo);
CREATE INDEX idx_reportes_estado ON reportes(estado);
CREATE INDEX idx_reportes_created_at ON reportes(created_at DESC);

-- Índices para audit_logs
CREATE INDEX idx_audit_logs_usuario_id ON audit_logs(usuario_id);
CREATE INDEX idx_audit_logs_entidad ON audit_logs(entidad, entidad_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Índices para carreras y facultades
CREATE INDEX idx_carreras_facultad_id ON carreras(facultad_id);
CREATE INDEX idx_carreras_nombre ON carreras(nombre);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_egresados_updated_at
    BEFORE UPDATE ON egresados
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empresas_updated_at
    BEFORE UPDATE ON empresas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formacion_updated_at
    BEFORE UPDATE ON formacion_academica
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiencia_updated_at
    BEFORE UPDATE ON experiencia_laboral
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ofertas_updated_at
    BEFORE UPDATE ON ofertas_laborales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_postulaciones_updated_at
    BEFORE UPDATE ON postulaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reportes_updated_at
    BEFORE UPDATE ON reportes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carreras_updated_at
    BEFORE UPDATE ON carreras
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facultades_updated_at
    BEFORE UPDATE ON facultades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para registrar en audit_logs
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        usuario_id,
        accion,
        entidad,
        entidad_id,
        datos_anteriores,
        datos_nuevos,
        ip_address
    ) VALUES (
        CASE WHEN TG_OP = 'INSERT' THEN NEW.user_id ELSE OLD.user_id END,
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        NULL
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VISTAS MATERIALIZADAS PARA DASHBOARDS
-- ============================================================

-- KPIs generales del sistema
CREATE MATERIALIZED VIEW mv_kpis_generales AS
SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'EGRESADO' AND is_active = true) AS total_egresados,
    (SELECT COUNT(*) FROM users WHERE role = 'EMPRESA' AND is_active = true) AS total_empresas,
    (SELECT COUNT(*) FROM ofertas_laborales WHERE activa = true AND (fecha_cierre IS NULL OR fecha_cierre > CURRENT_DATE)) AS ofertas_activas,
    ROUND(
        CASE
            WHEN (SELECT COUNT(*) FROM users WHERE role = 'EGRESADO' AND is_active = true) > 0
            THEN (SELECT COUNT(DISTINCT egresado_id) FROM postulaciones WHERE estado = 'CONTRATADO')::NUMERIC /
                 (SELECT COUNT(*) FROM users WHERE role = 'EGRESADO' AND is_active = true) * 100
            ELSE 0
        END, 2
    ) AS tasa_empleabilidad;

-- Distribución de egresados por carrera
CREATE MATERIALIZED VIEW mv_distribucion_egresados AS
SELECT
    c.id AS carrera_id,
    c.nombre AS carrera,
    f.nombre AS facultad,
    fa.carrera_id AS formacion_carrera_id,
    COUNT(DISTINCT e.id) AS total_egresados,
    COUNT(DISTINCT CASE WHEN p.estado = 'CONTRATADO' THEN e.id END) AS egresados_empleados,
    ROUND(
        CASE
            WHEN COUNT(DISTINCT e.id) > 0
            THEN COUNT(DISTINCT CASE WHEN p.estado = 'CONTRATADO' THEN e.id END)::NUMERIC /
                 COUNT(DISTINCT e.id) * 100
            ELSE 0
        END, 2
    ) AS tasa_empleabilidad
FROM egresados e
LEFT JOIN formacion_academica fa ON fa.egresado_id = e.id
LEFT JOIN carreras c ON c.id = fa.carrera_id
LEFT JOIN facultades f ON f.id = c.facultad_id
LEFT JOIN postulaciones p ON p.egresado_id = e.id
GROUP BY c.id, c.nombre, f.nombre, fa.carrera_id;

-- Demanda de habilidades en ofertas
CREATE MATERIALIZED VIEW mv_demanda_habilidades AS
SELECT
    h.id AS habilidad_id,
    h.nombre AS habilidad,
    h.tipo,
    h.categoria,
    COUNT(DISTINCT oh.oferta_id) AS total_ofertas,
    COUNT(DISTINCT CASE WHEN oh.obligatoria = true THEN oh.oferta_id END) AS ofertas_obligatoria,
    COUNT(DISTINCT CASE WHEN oh.obligatoria = false THEN oh.oferta_id END) AS ofertas_deseable
FROM habilidades h
LEFT JOIN oferta_habilidad oh ON oh.habilidad_id = h.id
LEFT JOIN ofertas_laborales o ON o.id = oh.oferta_id AND o.activa = true
GROUP BY h.id, h.nombre, h.tipo, h.categoria
ORDER BY total_ofertas DESC;

-- Ofertas publicadas por mes
CREATE MATERIALIZED VIEW mv_ofertas_por_mes AS
SELECT
    DATE_TRUNC('month', o.created_at) AS mes,
    COUNT(*) AS total_ofertas,
    COUNT(DISTINCT o.empresa_id) AS empresas_unicas
FROM ofertas_laborales o
GROUP BY DATE_TRUNC('month', o.created_at)
ORDER BY mes DESC;

-- Postulaciones por mes
CREATE MATERIALIZED VIEW mv_postulaciones_por_mes AS
SELECT
    DATE_TRUNC('month', p.fecha_postulacion) AS mes,
    COUNT(*) AS total_postulaciones,
    COUNT(DISTINCT p.oferta_id) AS ofertas_postuladas,
    COUNT(DISTINCT p.egresado_id) AS egresados_unicos
FROM postulaciones p
GROUP BY DATE_TRUNC('month', p.fecha_postulacion)
ORDER BY mes DESC;

-- Empleabilidad por cohorte (año de egreso)
CREATE MATERIALIZED VIEW mv_tasa_contratacion_cohorte AS
SELECT
    EXTRACT(YEAR FROM fa.fecha_fin) AS anio_egreso,
    c.nombre AS carrera,
    COUNT(DISTINCT e.id) AS total_egresados,
    COUNT(DISTINCT CASE WHEN p.estado = 'CONTRATADO' THEN e.id END) AS contratados,
    ROUND(
        CASE
            WHEN COUNT(DISTINCT e.id) > 0
            THEN COUNT(DISTINCT CASE WHEN p.estado = 'CONTRATADO' THEN e.id END)::NUMERIC /
                 COUNT(DISTINCT e.id) * 100
            ELSE 0
        END, 2
    ) AS tasa_contratacion
FROM egresados e
JOIN formacion_academica fa ON fa.egresado_id = e.id
JOIN carreras c ON c.id = fa.carrera_id
LEFT JOIN postulaciones p ON p.egresado_id = e.id
WHERE fa.culminada = true AND fa.fecha_fin IS NOT NULL
GROUP BY EXTRACT(YEAR FROM fa.fecha_fin), c.nombre
ORDER BY anio_egreso DESC, carrera;

-- Ofertas por ubicación (heatmap)
CREATE MATERIALIZED VIEW mv_ofertas_por_ubicacion AS
SELECT
    COALESCE(o.ciudad, 'No especificada') AS ciudad,
    COALESCE(o.pais, 'Colombia') AS pais,
    COUNT(*) AS total_ofertas,
    COUNT(DISTINCT o.empresa_id) AS empresas_unicas,
    ROUND(AVG(o.salario_min), 2) AS salario_promedio_min,
    ROUND(AVG(o.salario_max), 2) AS salario_promedio_max
FROM ofertas_laborales o
WHERE o.activa = true
GROUP BY o.ciudad, o.pais;

-- Posts únicos para verificar estado
CREATE UNIQUE INDEX idx_mv_kpis ON mv_kpis_generales(SELECT true);
CREATE UNIQUE INDEX idx_mv_distribucion ON mv_distribucion_egresados(carrera_id);
CREATE UNIQUE INDEX idx_mv_demanda ON mv_demanda_habilidades(habilidad_id);
CREATE UNIQUE INDEX idx_mv_ofertas_mes ON mv_ofertas_por_mes(mes);
CREATE UNIQUE INDEX idx_mv_postulaciones_mes ON mv_postulaciones_por_mes(mes);
CREATE UNIQUE INDEX idx_mv_cohorte ON mv_tasa_contratacion_cohorte(anio_egreso, carrera);
CREATE UNIQUE INDEX idx_mv_ubicacion ON mv_ofertas_por_ubicacion(ciudad, pais);

-- ============================================================
-- REFRESCAR VISTAS MATERIALIZADAS
-- ============================================================

-- Función para refrescar todas las vistas materializadas
CREATE OR REPLACE FUNCTION refresh_all_mv()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kpis_generales;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_distribucion_egresados;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_demanda_habilidades;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ofertas_por_mes;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_postulaciones_por_mes;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tasa_contratacion_cohorte;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ofertas_por_ubicacion;
END;
$$ LANGUAGE plpgsql;

-- Trigger para refrescar vistas al insertar/postular
CREATE OR REPLACE FUNCTION trigger_refresh_mv()
RETURNS TRIGGER AS $$
BEGIN
    -- Notificar que las MV necesitan refresh
    -- En producción, esto dispararía un job async
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DATA INICIAL
-- ============================================================

-- Insertar facultades
INSERT INTO facultades (nombre, codigo) VALUES
('Ingeniería', 'ING'),
('Ciencias Económicas', 'ECE'),
('Ciencias Sociales', 'CSO'),
('Salud', 'SAL');

-- Insertar carreras
INSERT INTO carreras (nombre, codigo, facultad_id) VALUES
('Ingeniería de Sistemas', 'IS', (SELECT id FROM facultades WHERE codigo = 'ING')),
('Ingeniería Industrial', 'II', (SELECT id FROM facultades WHERE codigo = 'ING')),
('Administración de Empresas', 'AE', (SELECT id FROM facultades WHERE codigo = 'ECE')),
('Contaduría Pública', 'CP', (SELECT id FROM facultades WHERE codigo = 'ECE')),
('Psicología', 'PSI', (SELECT id FROM facultades WHERE codigo = 'CSO')),
('Medicina', 'MED', (SELECT id FROM facultades WHERE codigo = 'SAL'));

-- Insertar habilidades técnicas
INSERT INTO habilidades (nombre, tipo, categoria) VALUES
('JavaScript', 'TECNICA', 'Desarrollo Web'),
('TypeScript', 'TECNICA', 'Desarrollo Web'),
('React', 'TECNICA', 'Desarrollo Web'),
('Node.js', 'TECNICA', 'Backend'),
('Python', 'TECNICA', 'Data Science'),
('SQL', 'TECNICA', 'Bases de Datos'),
('Docker', 'TECNICA', 'DevOps'),
('Git', 'TECNICA', 'Herramientas'),
('AWS', 'TECNICA', 'Cloud'),
('Machine Learning', 'TECNICA', 'Data Science');

-- Insertar habilidades blandas
INSERT INTO habilidades (nombre, tipo, categoria) VALUES
('Comunicación efectiva', 'BLANDA', 'Interpersonal'),
('Trabajo en equipo', 'BLANDA', 'Interpersonal'),
('Resolución de problemas', 'BLANDA', 'Analítica'),
('Liderazgo', 'BLANDA', 'Gestión'),
('Gestión del tiempo', 'BLANDA', 'Personal'),
('Adaptabilidad', 'BLANDA', 'Personal'),
('Pensamiento crítico', 'BLANDA', 'Analítica'),
('Creatividad', 'BLANDA', 'Innovación');

-- ============================================================
-- PERMISOS
-- ============================================================

-- Crear rol de solo lectura para dashboards
CREATE ROLE readonly_user;
GRANT CONNECT ON DATABASE postgres TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO readonly_user;

-- Crear rol para generación de reportes
CREATE ROLE report_generator;
GRANT CONNECT ON DATABASE postgres TO report_generator;
GRANT USAGE ON SCHEMA public TO report_generator;
GRANT SELECT, INSERT, UPDATE ON reportes TO report_generator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO report_generator;
GRANT EXECUTE ON FUNCTION refresh_all_mv() TO report_generator;