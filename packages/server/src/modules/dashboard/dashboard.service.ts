import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
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

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async getAdminDashboard(filters: AdminDashboardFiltersDto) {
    const cacheKey = `admin_dashboard:${JSON.stringify(filters)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [kpis, distribucion, habilidades] = await Promise.all([
      this.getKpisGenerales(),
      this.getDistribucionEgresados(filters),
      this.getDemandaHabilidades(filters.topHabilidades || 10),
    ]);

    const result = { kpis, distribucionEgresados: distribucion, demandaHabilidades: habilidades };
    await this.cache.set(cacheKey, result, CACHE_TTL.GENERAL);
    return result;
  }

  async getEmpresaDashboard(empresaId: string, filters: EmpresaDashboardFiltersDto) {
    if (!empresaId) return null;
    const cacheKey = `empresa_dashboard:${empresaId}:${JSON.stringify(filters)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [
      ofertasPublicadas,
      ofertasActivas,
      postulacionesRecibidas,
      candidatosContratados,
      ofertasHistorico,
      postulacionesRecibidasList,
    ] = await Promise.all([
      this.prisma.ofertaLaboral.count({ where: { empresa_id: empresaId } }),
      this.prisma.ofertaLaboral.count({ where: { empresa_id: empresaId, estado: 'activa' } }),
      this.prisma.postulacion.count({ where: { oferta_laboral: { empresa_id: empresaId } } }),
      this.prisma.postulacion.count({
        where: { oferta_laboral: { empresa_id: empresaId }, estado: 'CONTRATADO' },
      }),
      this.prisma.ofertaLaboral.findMany({
        where: { empresa_id: empresaId },
        orderBy: { creado_at: 'desc' },
        take: 10,
        include: {
          _count: {
            select: { postulaciones: true },
          },
        },
      }),
      this.prisma.postulacion.findMany({
        where: { oferta_laboral: { empresa_id: empresaId } },
        include: {
          egresado: {
            include: {
              usuario: { select: { email: true } },
            },
          },
          oferta_laboral: { select: { titulo: true } },
        },
        orderBy: { fecha_postulacion: 'desc' },
        take: 10,
      }),
    ]);

    const result = {
      ofertasPublicadas,
      ofertasActivas,
      postulacionesRecibidas,
      candidatosContratados,
      ofertasHistorico: ofertasHistorico.map(o => ({
        ...o,
        fechaPublicacion: o.creado_at,
        postulacionesCount: o._count.postulaciones,
      })),
      postulacionesRecibidasList: postulacionesRecibidasList.map(p => ({
        ...p,
        egresadoEmail: p.egresado.usuario.email,
        ofertaTitulo: p.oferta_laboral.titulo,
        fechaPostulacion: p.fecha_postulacion,
      })),
    };
    await this.cache.set(cacheKey, result, CACHE_TTL.EMPRESA);
    return result;
  }

  async getEgresadoDashboard(egresadoId: string, filters: EgresadoDashboardFiltersDto) {
    if (!egresadoId) return null;
    const cacheKey = `egresado_dashboard:${egresadoId}:${JSON.stringify(filters)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [
      postulacionesTotales,
      estadoPostulaciones,
      postulacionesRecientes,
      ofertasRecomendadas,
    ] = await Promise.all([
      this.prisma.postulacion.count({ where: { egresado_id: egresadoId } }),
      this.getEstadoPostulaciones(egresadoId),
      this.prisma.postulacion.findMany({
        where: { egresado_id: egresadoId },
        include: {
          oferta_laboral: {
            include: { empresa: { select: { nombre: true } } },
          },
        },
        orderBy: { fecha_postulacion: 'desc' },
        take: 5,
      }),
      this.prisma.ofertaLaboral.findMany({
        where: {
          estado: 'activa',
          postulaciones: {
            none: { egresado_id: egresadoId },
          },
        },
        orderBy: { creado_at: 'desc' },
        take: 5,
        include: { empresa: { select: { nombre: true } } },
      }),
    ]);

    const result = {
      postulacionesTotales,
      estadoPostulaciones,
      postulacionesRecientes: postulacionesRecientes.map(p => ({
        ...p,
        ofertaId: p.oferta_id,
        ofertaTitulo: p.oferta_laboral.titulo,
        empresaNombre: p.oferta_laboral.empresa.nombre,
        fechaPostulacion: p.fecha_postulacion,
      })),
      ofertasRecomendadas: ofertasRecomendadas.map(o => ({
        ...o,
        empresaNombre: o.empresa.nombre,
        fechaPublicacion: o.creado_at,
      })),
      // Campos adicionales esperados por el frontend
      ofertasVistas: 0, 
      tasaRespuesta: postulacionesTotales > 0 
        ? Math.round(((estadoPostulaciones.ENTREVISTA + estadoPostulaciones.CONTRATADO) / postulacionesTotales) * 100) 
        : 0,
    };
    await this.cache.set(cacheKey, result, CACHE_TTL.EGRESADO);
    return result;
  }

  async getAuditLogs(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { creado_at: 'desc' },
        include: {
          usuario: { select: { email: true } },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async invalidateCache(pattern?: string): Promise<void> {
    if (pattern) {
      await this.cache.delPattern(pattern);
    } else {
      await this.cache.delPattern('*');
    }
  }

  private async getKpisGenerales() {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        (SELECT COUNT(*) FROM egresados)::int AS total_egresados,
        (SELECT COUNT(*) FROM empresas)::int AS total_empresas,
        (SELECT COUNT(*) FROM ofertas_laborales WHERE estado = 'activa')::int AS ofertas_activas,
        ROUND(
          COALESCE(
            (SELECT COUNT(DISTINCT egresado_id)::numeric FROM postulaciones WHERE estado = 'CONTRATADO') /
            NULLIF((SELECT COUNT(*) FROM egresados), 0) * 100
          , 0)
        , 2) AS tasa_empleabilidad
    `;
    return result[0] || {
      total_egresados: 0,
      total_empresas: 0,
      ofertas_activas: 0,
      tasa_empleabilidad: 0
    };
  }

  private async getDistribucionEgresados(filters: DashboardFiltersDto) {
    return this.prisma.$queryRaw<any[]>`
      SELECT 
        c.nombre AS carrera,
        COUNT(DISTINCT e.id)::int AS total_egresados,
        COUNT(DISTINCT CASE WHEN p.estado = 'CONTRATADO' THEN e.id END)::int AS egresados_empleados
      FROM egresados e
      LEFT JOIN formacion_academica fa ON fa.egresado_id = e.id
      LEFT JOIN carreras c ON c.id = fa.carrera_id
      LEFT JOIN postulaciones p ON p.egresado_id = e.id
      GROUP BY c.nombre
      ORDER BY total_egresados DESC
    `;
  }

  private async getDemandaHabilidades(limit: number) {
    return this.prisma.$queryRaw<any[]>`
      SELECT 
        h.nombre AS habilidad,
        COUNT(DISTINCT oh.oferta_id)::int AS total_ofertas
      FROM habilidades h
      LEFT JOIN oferta_habilidad oh ON oh.habilidad_id = h.id
      GROUP BY h.nombre
      ORDER BY total_ofertas DESC
      LIMIT ${limit}
    `;
  }

  private async getEstadoPostulaciones(egresadoId: string) {
    const result = await this.prisma.postulacion.groupBy({
      by: ['estado'],
      where: { egresado_id: egresadoId },
      _count: { estado: true },
    });
    
    // Transformar a un formato más fácil de consumir por el frontend
    const stats: Record<string, number> = {
      POSTULADO: 0,
      EN_REVISION: 0,
      ENTREVISTA: 0,
      CONTRATADO: 0,
      RECHAZADO: 0
    };
    
    if (result && Array.isArray(result)) {
      result.forEach(item => {
        if (item.estado && stats.hasOwnProperty(item.estado)) {
          stats[item.estado] = item._count.estado;
        }
      });
    }
    
    return stats;
  }
}
