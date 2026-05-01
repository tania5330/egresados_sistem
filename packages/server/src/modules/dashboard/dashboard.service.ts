import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../common/services/cache.service';
import {
  DashboardFiltersDto,
  AdminDashboardFiltersDto,
  EmpresaDashboardFiltersDto,
  EgresadoDashboardFiltersDto,
} from './dto/dashboard-filters.dto';

const CACHE_TTL = {
  GENERAL: 300,
  EMPRESA: 60,
  EGRESADO: 60,
};

interface KpisGenerales {
  total_egresados: number;
  total_empresas: number;
  ofertas_activas: number;
  tasa_empleabilidad: number;
}

interface DistribucionEgresados {
  carrera_id: string | null;
  carrera: string | null;
  facultad: string | null;
  total_egresados: number;
  egresados_empleados: number;
  tasa_empleabilidad: number;
}

interface DemandaHabilidades {
  habilidad_id: string;
  habilidad: string;
  tipo: string;
  categoria: string | null;
  total_ofertas: number;
  ofertas_obligatoria: number;
  ofertas_deseable: number;
}

interface OfertasPorMes {
  mes: Date;
  total_ofertas: number;
  empresas_unicas: number;
}

interface PostulacionesPorMes {
  mes: Date;
  total_postulaciones: number;
  ofertas_postuladas: number;
  egresados_unicos: number;
}

interface TasaContratacionCohorte {
  anio_egreso: number;
  carrera: string;
  total_egresados: number;
  contratados: number;
  tasa_contratacion: number;
}

interface OfertasPorUbicacion {
  ciudad: string;
  pais: string;
  total_ofertas: number;
  empresas_unicas: number;
  salario_promedio_min: number | null;
  salario_promedio_max: number | null;
}

interface AdminDashboard {
  kpis: KpisGenerales;
  distribucionEgresados: DistribucionEgresados[];
  demandaHabilidades: DemandaHabilidades[];
  ofertasPorMes: OfertasPorMes[];
  postulacionesPorMes: PostulacionesPorMes[];
  tasaContratacionCohorte: TasaContratacionCohorte[];
  ofertasPorUbicacion: OfertasPorUbicacion[];
}

interface OfertaResumen {
  id: string;
  titulo: string;
  fechaPublicacion: Date;
  ciudad: string | null;
  salarioMin: number | null;
  salarioMax: number | null;
  modalidad: string;
  tipoContrato: string;
}

interface PostulacionResumen {
  id: string;
  ofertaId: string;
  ofertaTitulo: string;
  empresaNombre: string | null;
  estado: string;
  fechaPostulacion: Date;
}

interface EmpresaDashboard {
  ofertasPublicadas: number;
  ofertasActivas: number;
  postulacionesRecibidas: number;
  candidatosContratados: number;
  ofertasHistorico: OfertaResumen[];
  postulacionesRecibidasList: PostulacionResumen[];
  ofertasPorMes: OfertasPorMes[];
  rendimientoPromedio: number;
}

interface EgresadoDashboard {
  postulacionesTotales: number;
  ofertasVistas: number;
  tasaRespuesta: number;
  ofertasRecomendadas: OfertaResumen[];
  postulacionesRecientes: PostulacionResumen[];
  estadoPostulaciones: {
   POSTULADO: number;
    EN_REVISION: number;
    ENTREVISTA: number;
    CONTRATADO: number;
    RECHAZADO: number;
  };
}

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async getAdminDashboard(filters: AdminDashboardFiltersDto): Promise<AdminDashboard> {
    const cacheKey = `admin_dashboard:${JSON.stringify(filters)}`;
    const cached = await this.cache.get<AdminDashboard>(cacheKey);
    if (cached) return cached;

    const [kpis, distribucion, habilidades, ofertasMes, postulacionesMes, cohorte, ubicacion] = await Promise.all([
      this.getKpisGenerales(),
      this.getDistribucionEgresados(filters),
      this.getDemandaHabilidades(filters.topHabilidades || 10),
      this.getOfertasPorMes(filters),
      this.getPostulacionesPorMes(filters),
      this.getTasaContratacionCohorte(filters),
      this.getOfertasPorUbicacion(),
    ]);

    const result: AdminDashboard = {
      kpis,
      distribucionEgresados: distribucion,
      demandaHabilidades: habilidades,
      ofertasPorMes: ofertasMes,
      postulacionesPorMes: postulacionesMes,
      tasaContratacionCohorte: cohorte,
      ofertasPorUbicacion: ubicacion,
    };

    await this.cache.set(cacheKey, result, CACHE_TTL.GENERAL);
    return result;
  }

  async getEmpresaDashboard(empresaId: string, filters: EmpresaDashboardFiltersDto): Promise<EmpresaDashboard> {
    const cacheKey = `empresa_dashboard:${empresaId}:${JSON.stringify(filters)}`;
    const cached = await this.cache.get<EmpresaDashboard>(cacheKey);
    if (cached) return cached;

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true },
    });

    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }

    const [ofertasPublicadas, ofertasActivas, postulacionesRecibidas, candidatosContratados] = await Promise.all([
      this.prisma.ofertaLaboral.count({ where: { empresaId } }),
      this.prisma.ofertaLaboral.count({ where: { empresaId, activa: true } }),
      this.prisma.postulacion.count({
        where: { oferta: { empresaId } },
      }),
      this.prisma.postulacion.count({
        where: { oferta: { empresaId }, estado: 'CONTRATADO' },
      }),
    ]);

    const ofertasHistorico = await this.prisma.ofertaLaboral.findMany({
      where: { empresaId },
      select: {
        id: true,
        titulo: true,
        created_at: true,
        ciudad: true,
        salario_min: true,
        salario_max: true,
        modalidad: true,
        tipo_contrato: true,
      },
      orderBy: { created_at: 'desc' },
      take: filters.limite || 10,
    });

    const postulacionesRecibidasList = await this.prisma.postulacion.findMany({
      where: { oferta: { empresaId } },
      select: {
        id: true,
        ofertaId: true,
        estado: true,
        fecha_postulacion: true,
        oferta: {
          select: { titulo: true, empresa: { select: { nombre: true } } },
        },
        egresado: {
          select: { user: { select: { email: true } } },
        },
      },
      orderBy: { fecha_postulacion: 'desc' },
      take: filters.limite || 20,
    });

    const ofertasPorMes = await this.getOfertasPorMesEmpresa(empresaId, filters);
    const rendimientoPromedio = ofertasPublicadas > 0 
      ? Number((candidatosContratados / ofertasPublicadas).toFixed(2)) 
      : 0;

    const result: EmpresaDashboard = {
      ofertasPublicadas,
      ofertasActivas,
      postulacionesRecibidas,
      candidatosContratados,
      ofertasHistorico: ofertasHistorico.map(o => ({
        id: o.id,
        titulo: o.titulo,
        fechaPublicacion: o.created_at,
        ciudad: o.ciudad,
        salarioMin: o.salario_min,
        salarioMax: o.salario_max,
        modalidad: o.modalidad,
        tipoContrato: o.tipo_contrato,
      })),
      postulacionesRecibidasList: postulacionesRecibidasList.map(p => ({
        id: p.id,
        ofertaId: p.ofertaId,
        ofertaTitulo: p.oferta.titulo,
        empresaNombre: p.oferta.empresa.nombre,
        estado: p.estado,
        fechaPostulacion: p.fecha_postulacion,
      })),
      ofertasPorMes,
      rendimientoPromedio,
    };

    await this.cache.set(cacheKey, result, CACHE_TTL.EMPRESA);
    return result;
  }

  async getEgresadoDashboard(egresadoId: string, filters: EgresadoDashboardFiltersDto): Promise<EgresadoDashboard> {
    const cacheKey = `egresado_dashboard:${egresadoId}:${JSON.stringify(filters)}`;
    const cached = await this.cache.get<EgresadoDashboard>(cacheKey);
    if (cached) return cached;

    const [postulacionesTotales, estadoPostulaciones, egresado] = await Promise.all([
      this.prisma.postulacion.count({ where: { egresadoId } }),
      this.getEstadoPostulaciones(egresadoId),
      this.prisma.egresado.findUnique({
        where: { id: egresadoId },
        include: {
          formacionAcademica: {
            include: { carrera: true },
          },
          habilidades: {
            include: { habilidad: true },
          },
        },
      }),
    ]);

    const ofertasVistas = await this.prisma.ofertaLaboral.count({
      where: {
        created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const respuestasCount = await this.prisma.postulacion.count({
      where: { egresadoId, estado: { not: 'POSTULADO' } },
    });

    const tasaRespuesta = postulacionesTotales > 0
      ? Number(((respuestasCount / postulacionesTotales) * 100).toFixed(2))
      : 0;

    const ofertasRecomendadas = await this.getOfertasRecomendadas(egresado, filters.limiteOfertas || 10);

    const postulacionesRecientes = await this.prisma.postulacion.findMany({
      where: { egresadoId },
      select: {
        id: true,
        ofertaId: true,
        estado: true,
        fecha_postulacion: true,
        oferta: {
          select: {
            titulo: true,
            empresa: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fecha_postulacion: 'desc' },
      take: 10,
    });

    const result: EgresadoDashboard = {
      postulacionesTotales,
      ofertasVistas,
      tasaRespuesta,
      ofertasRecomendadas: ofertasRecomendadas.map(o => ({
        id: o.id,
        titulo: o.titulo,
        fechaPublicacion: o.created_at,
        ciudad: o.ciudad,
        salarioMin: o.salario_min,
        salarioMax: o.salario_max,
        modalidad: o.modalidad,
        tipoContrato: o.tipo_contrato,
      })),
      postulacionesRecientes: postulacionesRecientes.map(p => ({
        id: p.id,
        ofertaId: p.ofertaId,
        ofertaTitulo: p.oferta.titulo,
        empresaNombre: p.oferta.empresa?.nombre || null,
        estado: p.estado,
        fechaPostulacion: p.fecha_postulacion,
      })),
      estadoPostulaciones,
    };

    await this.cache.set(cacheKey, result, CACHE_TTL.EGRESADO);
    return result;
  }

  private async getKpisGenerales(): Promise<KpisGenerales> {
    const result = await this.prisma.$queryRaw<KpisGenerales[]>`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'EGRESADO' AND is_active = true)::int AS total_egresados,
        (SELECT COUNT(*) FROM users WHERE role = 'EMPRESA' AND is_active = true)::int AS total_empresas,
        (SELECT COUNT(*) FROM ofertas_laborales WHERE activa = true AND (fecha_cierre IS NULL OR fecha_cierre > CURRENT_DATE))::int AS ofertas_activas,
        ROUND(
          COALESCE(
            (SELECT COUNT(DISTINCT egresado_id)::numeric FROM postulaciones WHERE estado = 'CONTRATADO') /
            NULLIF((SELECT COUNT(*) FROM users WHERE role = 'EGRESADO' AND is_active = true), 0) * 100
          , 0)
        , 2) AS tasa_empleabilidad
    `;
    return result[0];
  }

  private async getDistribucionEgresados(filters: DashboardFiltersDto): Promise<DistribucionEgresados[]> {
    let query = `
      SELECT 
        c.id AS carrera_id,
        c.nombre AS carrera,
        f.nombre AS facultad,
        COUNT(DISTINCT e.id)::int AS total_egresados,
        COUNT(DISTINCT CASE WHEN p.estado = 'CONTRATADO' THEN e.id END)::int AS egresados_empleados,
        ROUND(
          COALESCE(
            COUNT(DISTINCT CASE WHEN p.estado = 'CONTRATADO' THEN e.id END)::numeric /
            NULLIF(COUNT(DISTINCT e.id), 0) * 100
          , 0)
        , 2) AS tasa_empleabilidad
      FROM egresados e
      LEFT JOIN formacion_academica fa ON fa.egresado_id = e.id
      LEFT JOIN carreras c ON c.id = fa.carrera_id
      LEFT JOIN facultades f ON f.id = c.facultad_id
      LEFT JOIN postulaciones p ON p.egresado_id = e.id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (filters.carreraId) {
      params.push(filters.carreraId);
      conditions.push(`c.id = $${params.length}`);
    }

    if (filters.facultadId) {
      params.push(filters.facultadId);
      conditions.push(`f.id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY c.id, c.nombre, f.nombre ORDER BY total_egresados DESC`;

    if (filters.limite) {
      query += ` LIMIT ${filters.limite}`;
    }

    return this.prisma.$queryRawUnsafe<DistribucionEgresados[]>(query, ...params);
  }

  private async getDemandaHabilidades(limit: number): Promise<DemandaHabilidades[]> {
    return this.prisma.$queryRaw<DemandaHabilidades[]>`
      SELECT 
        h.id AS habilidad_id,
        h.nombre AS habilidad,
        h.tipo::text,
        h.categoria,
        COUNT(DISTINCT oh.oferta_id)::int AS total_ofertas,
        COUNT(DISTINCT CASE WHEN oh.obligatoria = true THEN oh.oferta_id END)::int AS ofertas_obligatoria,
        COUNT(DISTINCT CASE WHEN oh.obligatoria = false THEN oh.oferta_id END)::int AS ofertas_deseable
      FROM habilidades h
      LEFT JOIN oferta_habilidad oh ON oh.habilidad_id = h.id
      LEFT JOIN ofertas_laborales o ON o.id = oh.oferta_id AND o.activa = true
      GROUP BY h.id, h.nombre, h.tipo, h.categoria
      ORDER BY total_ofertas DESC
      LIMIT ${limit}
    `;
  }

  private async getOfertasPorMes(filters: DashboardFiltersDto): Promise<OfertasPorMes[]> {
    let query = `
      SELECT 
        DATE_TRUNC('month', o.created_at)::timestamp AS mes,
        COUNT(*)::int AS total_ofertas,
        COUNT(DISTINCT o.empresa_id)::int AS empresas_unicas
      FROM ofertas_laborales o
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.fechaInicio) {
      params.push(new Date(filters.fechaInicio));
      query += ` AND o.created_at >= $${params.length}`;
    }

    if (filters.fechaFin) {
      params.push(new Date(filters.fechaFin));
      query += ` AND o.created_at <= $${params.length}`;
    }

    query += ` GROUP BY DATE_TRUNC('month', o.created_at) ORDER BY mes DESC`;

    return this.prisma.$queryRawUnsafe<OfertasPorMes[]>(query, ...params);
  }

  private async getPostulacionesPorMes(filters: DashboardFiltersDto): Promise<PostulacionesPorMes[]> {
    let query = `
      SELECT 
        DATE_TRUNC('month', p.fecha_postulacion)::timestamp AS mes,
        COUNT(*)::int AS total_postulaciones,
        COUNT(DISTINCT p.oferta_id)::int AS ofertas_postuladas,
        COUNT(DISTINCT p.egresado_id)::int AS egresados_unicos
      FROM postulaciones p
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.fechaInicio) {
      params.push(new Date(filters.fechaInicio));
      query += ` AND p.fecha_postulacion >= $${params.length}`;
    }

    if (filters.fechaFin) {
      params.push(new Date(filters.fechaFin));
      query += ` AND p.fecha_postulacion <= $${params.length}`;
    }

    query += ` GROUP BY DATE_TRUNC('month', p.fecha_postulacion) ORDER BY mes DESC`;

    return this.prisma.$queryRawUnsafe<PostulacionesPorMes[]>(query, ...params);
  }

  private async getTasaContratacionCohorte(filters: DashboardFiltersDto): Promise<TasaContratacionCohorte[]> {
    let query = `
      SELECT 
        EXTRACT(YEAR FROM fa.fecha_fin)::int AS anio_egreso,
        c.nombre AS carrera,
        COUNT(DISTINCT e.id)::int AS total_egresados,
        COUNT(DISTINCT CASE WHEN p.estado = 'CONTRATADO' THEN e.id END)::int AS contratados,
        ROUND(
          COALESCE(
            COUNT(DISTINCT CASE WHEN p.estado = 'CONTRATADO' THEN e.id END)::numeric /
            NULLIF(COUNT(DISTINCT e.id), 0) * 100
          , 0)
        , 2) AS tasa_contratacion
      FROM egresados e
      JOIN formacion_academica fa ON fa.egresado_id = e.id
      JOIN carreras c ON c.id = fa.carrera_id
      LEFT JOIN postulaciones p ON p.egresado_id = e.id
      WHERE fa.culminada = true AND fa.fecha_fin IS NOT NULL
    `;

    const params: any[] = [];

    if (filters.anioEgreso) {
      params.push(filters.anioEgreso);
      query += ` AND EXTRACT(YEAR FROM fa.fecha_fin) = $${params.length}`;
    }

    if (filters.carreraId) {
      params.push(filters.carreraId);
      query += ` AND c.id = $${params.length}`;
    }

    query += ` GROUP BY EXTRACT(YEAR FROM fa.fecha_fin), c.nombre ORDER BY anio_egreso DESC, carrera`;

    return this.prisma.$queryRawUnsafe<TasaContratacionCohorte[]>(query, ...params);
  }

  private async getOfertasPorUbicacion(): Promise<OfertasPorUbicacion[]> {
    return this.prisma.$queryRaw<OfertasPorUbicacion[]>`
      SELECT 
        COALESCE(o.ciudad, 'No especificada') AS ciudad,
        COALESCE(o.pais, 'Colombia') AS pais,
        COUNT(*)::int AS total_ofertas,
        COUNT(DISTINCT o.empresa_id)::int AS empresas_unicas,
        ROUND(AVG(o.salario_min), 2) AS salario_promedio_min,
        ROUND(AVG(o.salario_max), 2) AS salario_promedio_max
      FROM ofertas_laborales o
      WHERE o.activa = true
      GROUP BY o.ciudad, o.pais
      ORDER BY total_ofertas DESC
    `;
  }

  private async getOfertasPorMesEmpresa(empresaId: string, filters: DashboardFiltersDto): Promise<OfertasPorMes[]> {
    let query = `
      SELECT 
        DATE_TRUNC('month', o.created_at)::timestamp AS mes,
        COUNT(*)::int AS total_ofertas,
        COUNT(DISTINCT o.empresa_id)::int AS empresas_unicas
      FROM ofertas_laborales o
      WHERE o.empresa_id = $1
    `;

    const params: any[] = [empresaId];

    if (filters.fechaInicio) {
      params.push(new Date(filters.fechaInicio));
      query += ` AND o.created_at >= $${params.length}`;
    }

    if (filters.fechaFin) {
      params.push(new Date(filters.fechaFin));
      query += ` AND o.created_at <= $${params.length}`;
    }

    query += ` GROUP BY DATE_TRUNC('month', o.created_at) ORDER BY mes DESC`;

    return this.prisma.$queryRawUnsafe<OfertasPorMes[]>(query, ...params);
  }

  private async getEstadoPostulaciones(egresadoId: string): Promise<EgresadoDashboard['estadoPostulaciones']> {
    const result = await this.prisma.postulacion.groupBy({
      by: ['estado'],
      where: { egresadoId },
      _count: { estado: true },
    });

    const estadoPostulaciones: EgresadoDashboard['estadoPostulaciones'] = {
      POSTULADO: 0,
      EN_REVISION: 0,
      ENTREVISTA: 0,
      CONTRATADO: 0,
      RECHAZADO: 0,
    };

    for (const item of result) {
      estadoPostulaciones[item.estado as keyof typeof estadoPostulaciones] = item._count.estado;
    }

    return estadoPostulaciones;
  }

  private async getOfertasRecomendadas(
    egresado: any,
    limit: number,
  ): Promise<any[]> {
    if (!egresado) return [];

    const habilidadIds = egresado.habilidades?.map((h: any) => h.habilidadId) || [];
    const carreraId = egresado.formacionAcademica?.[0]?.carreraId;

    const ofertas = await this.prisma.ofertaLaboral.findMany({
      where: {
        activa: true,
        fecha_cierre: { gte: new Date() },
      },
      include: {
        habilidades: {
          include: { habilidad: true },
        },
        empresa: { select: { nombre: true } },
      },
      orderBy: { created_at: 'desc' },
      take: limit * 2,
    });

    const scored = ofertas.map(oferta => {
      let score = 0;

      if (habilidadIds.length > 0) {
        const matchedSkills = oferta.habilidades.filter(
          (oh: any) => habilidadIds.includes(oh.habilidadId),
        ).length;
        score += matchedSkills * 10;
      }

      if (carreraId) {
        const hasMatchingSkill = oferta.habilidades.some(
          (oh: any) => oh.habilidad.tipo === 'TECNICA',
        );
        if (hasMatchingSkill) score += 5;
      }

      return { oferta, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(s => s.oferta);
  }

  async invalidateCache(pattern?: string): Promise<void> {
    if (pattern) {
      await this.cache.delPattern(pattern);
    } else {
      await this.cache.delPattern('*');
    }
  }
}
