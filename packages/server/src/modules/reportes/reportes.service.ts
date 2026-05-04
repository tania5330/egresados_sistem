import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportesQueue, ReporteJobData } from './reportes.queue';
import {
  TipoReporte,
  EstadoReporte,
  CreateReporteInput,
  FiltrosListadoEgresados,
  FiltrosListadoOfertas,
  FiltrosPostulacionesPorOferta,
  FiltrosReporteEmpleabilidad,
  FiltrosReporteDemandaLaboral,
  FiltrosReporteComparativoCohorte,
} from './dto';
import { FilterReporteDto } from './dto/filter-reporte.dto';

export interface ReporteResponse {
  id: string;
  tipo: string;
  estado: string;
  archivoUrl: string | null;
  errorMensaje: string | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  createdAt: Date;
  parametros: Record<string, any>;
}

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  constructor(
    private prisma: PrismaService,
    private reportesQueue: ReportesQueue,
  ) {}

  async crearReporte(input: CreateReporteInput, usuarioId: string): Promise<{ reporteId: string; jobId: string }> {
    const reporte = await this.prisma.reporte.create({
      data: {
        usuario_id: usuarioId,
        tipo: input.tipo,
        parametros: input.filtros || {},
        estado: EstadoReporte.PENDIENTE,
        fecha_inicio: new Date(),
      },
    });

    const jobData: ReporteJobData = {
      reporteId: reporte.id,
      usuarioId,
      tipo: input.tipo,
      parametros: input.filtros || {},
    };

    const jobId = await this.reportesQueue.addReporteJob(jobData);
    this.logger.log(`Created reporte ${reporte.id} with job ${jobId}`);
    return { reporteId: reporte.id, jobId };
  }

  async getReporteById(id: string): Promise<ReporteResponse> {
    const reporte = await this.prisma.reporte.findUnique({ where: { id } });
    if (!reporte) throw new NotFoundException('Reporte no encontrado');
    return this.mapReporteResponse(reporte);
  }

  async getMisReportes(usuarioId: string, filters: FilterReporteDto) {
    const where: any = { usuario_id: usuarioId };
    if (filters.tipo) where.tipo = filters.tipo;
    if (filters.estado) where.estado = filters.estado;
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [reportes, total] = await Promise.all([
      this.prisma.reporte.findMany({
        where,
        orderBy: { creado_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.reporte.count({ where }),
    ]);

    return {
      data: reportes.map(r => this.mapReporteResponse(r)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getEstadoReporte(reporteId: string) {
    const reporte = await this.prisma.reporte.findUnique({
      where: { id: reporteId },
      select: { id: true, estado: true, archivo_url: true, error_mensaje: true },
    });
    if (!reporte) throw new NotFoundException('Reporte no encontrado');
    const jobStatus = await this.reportesQueue.getJobStatus(reporteId);
    return {
      estado: reporte.estado as string,
      progreso: reporte.estado === EstadoReporte.COMPLETADO ? 100 : jobStatus.progress,
      archivoUrl: reporte.archivo_url,
      errorMensaje: reporte.error_mensaje,
    };
  }

  async updateReporteEstado(id: string, estado: EstadoReporte): Promise<void> {
    await this.prisma.reporte.update({
      where: { id },
      data: { estado },
    });
  }

  async updateReporteCompletado(id: string, archivoUrl: string): Promise<void> {
    await this.prisma.reporte.update({
      where: { id },
      data: {
        estado: EstadoReporte.COMPLETADO,
        archivo_url: archivoUrl,
        fecha_fin: new Date(),
      },
    });
  }

  async updateReporteError(id: string, errorMensaje: string): Promise<void> {
    await this.prisma.reporte.update({
      where: { id },
      data: {
        estado: EstadoReporte.ERROR,
        error_mensaje: errorMensaje,
        fecha_fin: new Date(),
      },
    });
  }

  async cancelarReporte(reporteId: string, usuarioId: string): Promise<boolean> {
    const reporte = await this.prisma.reporte.findUnique({ where: { id: reporteId } });
    if (!reporte) throw new NotFoundException('Reporte no encontrado');
    if (reporte.usuario_id !== usuarioId) throw new NotFoundException('No autorizado');

    const cancelled = await this.reportesQueue.cancelJob(reporteId);
    if (cancelled) {
      await this.updateReporteError(reporteId, 'Cancelado por el usuario');
    }
    return cancelled;
  }

  async getDataListadoEgresados(filtros: FiltrosListadoEgresados) {
    const where: any = {};
    if (filtros.carreraIds?.length) where.formacion_academica = { some: { carrera_id: { in: filtros.carreraIds } } };
    if (filtros.habilidadIds?.length) where.habilidades = { some: { habilidad_id: { in: filtros.habilidadIds } } };
    if (filtros.soloBuscandoEmpleo !== undefined) where.buscando_empleo = filtros.soloBuscandoEmpleo;

    const egresados = await this.prisma.egresado.findMany({
      where,
      include: {
        usuario: { select: { email: true } },
        formacion_academica: { include: { carrera: { include: { facultad: true } } } },
        experiencia_laboral: true,
        habilidades: { include: { habilidad: true } },
      },
    });
    return { egresados, filtros };
  }

  async getDataListadoOfertas(filtros: FiltrosListadoOfertas) {
    const where: any = {};
    if (filtros.activa !== undefined) where.estado = filtros.activa ? 'activa' : 'cerrada';
    if (filtros.ciudad) where.ciudad = { contains: filtros.ciudad, mode: 'insensitive' };
    
    const ofertas = await this.prisma.ofertaLaboral.findMany({
      where,
      include: {
        empresa: true,
        habilidades: { include: { habilidad: true } },
        _count: { select: { postulaciones: true } },
      },
      orderBy: { creado_at: 'desc' },
    });
    return { ofertas, filtros };
  }

  async getDataPostulacionesPorOferta(filtros: FiltrosPostulacionesPorOferta) {
    const postulaciones = await this.prisma.postulacion.findMany({
      where: { oferta_id: filtros.ofertaId },
      include: {
        egresado: {
          include: {
            usuario: { select: { email: true } },
            formacion_academica: { include: { carrera: true } },
            habilidades: { include: { habilidad: true } },
          },
        },
        oferta_laboral: { include: { empresa: true } },
        historial_estados: { orderBy: { fecha: 'desc' } },
      },
      orderBy: { fecha_postulacion: 'desc' },
    });
    const oferta = await this.prisma.ofertaLaboral.findUnique({ where: { id: filtros.ofertaId }, include: { empresa: true } });
    return { postulaciones, oferta, filtros };
  }

  async getDataReporteEmpleabilidad(filtros: FiltrosReporteEmpleabilidad) {
    return { porCarrera: [], porAnio: [], filtros };
  }

  async getDataReporteDemandaLaboral(filtros: FiltrosReporteDemandaLaboral) {
    return { topHabilidades: [], sectores: [], porModalidad: [], porTipoContrato: [], filtros };
  }

  async getDataReporteComparativoCohorte(filtros: FiltrosReporteComparativoCohorte) {
    return { cohorte: [], filtros };
  }

  async getDataOperacional() {
    const [totalEgresados, totalEmpresas, totalOfertas, totalPostulaciones] = await Promise.all([
      this.prisma.egresado.count(),
      this.prisma.empresa.count(),
      this.prisma.ofertaLaboral.count(),
      this.prisma.postulacion.count(),
    ]);
    return { totalEgresados, totalEmpresas, totalOfertas, totalPostulaciones, fecha: new Date() };
  }

  async getDataGestion() {
    const [egresadosContratados, totalEgresados, topHabilidades] = await Promise.all([
      this.prisma.postulacion.count({ where: { estado: 'CONTRATADO' } }),
      this.prisma.egresado.count(),
      this.prisma.$queryRaw<any[]>`
        SELECT h.nombre, COUNT(oh.id)::int as count 
        FROM habilidades h 
        JOIN oferta_habilidad oh ON h.id = oh.habilidad_id 
        GROUP BY h.nombre 
        ORDER BY count DESC 
        LIMIT 5`,
    ]);

    const tasaEmpleabilidad = totalEgresados > 0 ? (egresadosContratados / totalEgresados) * 100 : 0;

    return { 
      tasaEmpleabilidad: tasaEmpleabilidad.toFixed(2), 
      totalEgresados, 
      egresadosContratados, 
      topHabilidades,
      fecha: new Date() 
    };
  }

  async generatePdfReport(tipo: string, data: any, parametros: any): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text(`Reporte ${tipo}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Fecha de generación: ${new Date().toLocaleString()}`);
      doc.moveDown();

      // Content based on type
      if (tipo === TipoReporte.OPERACIONAL) {
        doc.text(`Total Egresados: ${data.totalEgresados}`);
        doc.text(`Total Empresas: ${data.totalEmpresas}`);
        doc.text(`Total Ofertas: ${data.totalOfertas}`);
        doc.text(`Total Postulaciones: ${data.totalPostulaciones}`);
      } else if (tipo === TipoReporte.GESTION) {
        doc.text(`Tasa de Empleabilidad: ${data.tasaEmpleabilidad}%`);
        doc.text(`Total Egresados: ${data.totalEgresados}`);
        doc.text(`Egresados Contratados: ${data.egresadosContratados}`);
        doc.moveDown();
        doc.text('Top 5 Habilidades Demandadas:');
        data.topHabilidades.forEach((h: any, i: number) => {
          doc.text(`${i + 1}. ${h.nombre}: ${h.count} menciones`);
        });
      } else {
        doc.text('Resumen de datos:');
        doc.text(JSON.stringify(data, null, 2));
      }

      doc.end();
    });
  }

  private mapReporteResponse(reporte: any): ReporteResponse {
    return {
      id: reporte.id,
      tipo: reporte.tipo,
      estado: reporte.estado,
      archivoUrl: reporte.archivo_url,
      errorMensaje: reporte.error_mensaje,
      fechaInicio: reporte.fecha_inicio,
      fechaFin: reporte.fecha_fin,
      createdAt: reporte.creado_at,
      parametros: reporte.parametros as Record<string, any>,
    };
  }
}
