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
    const totalEgresados = await this.prisma.egresado.count();
    const egresadosContratados = await this.prisma.postulacion.count({ where: { estado: 'CONTRATADO' } });
    const tasaGeneral = totalEgresados > 0 ? (egresadosContratados / totalEgresados) * 100 : 0;

    // Obtener datos por carrera
    const porCarrera = await this.prisma.carrera.findMany({
      include: {
        formacion_academica: {
          include: {
            egresado: {
              include: {
                postulaciones: {
                  where: { estado: 'CONTRATADO' }
                }
              }
            }
          }
        }
      }
    });

    const dataPorCarrera = porCarrera.map(c => {
      const total = c.formacion_academica.length;
      const contratados = c.formacion_academica.filter(f => f.egresado.postulaciones.length > 0).length;
      return {
        nombre: c.nombre,
        total,
        contratados,
        tasa: total > 0 ? ((contratados / total) * 100).toFixed(2) : '0.00'
      };
    }).filter(c => c.total > 0);

    return { 
      tasaGeneral: tasaGeneral.toFixed(2), 
      totalEgresados, 
      egresadosContratados, 
      dataPorCarrera,
      filtros 
    };
  }

  async getDataReporteDemandaLaboral(filtros: FiltrosReporteDemandaLaboral) {
    const topHabilidades = await this.prisma.$queryRaw<any[]>`
      SELECT h.nombre, COUNT(oh.id)::int as count 
      FROM habilidades h 
      JOIN oferta_habilidad oh ON h.id = oh.habilidad_id 
      GROUP BY h.nombre 
      ORDER BY count DESC 
      LIMIT 10`;

    const modalidades = await this.prisma.ofertaLaboral.groupBy({
      by: ['modalidad'],
      _count: { id: true }
    });

    const sectores = await this.prisma.empresa.groupBy({
      by: ['sector'],
      _count: { id: true }
    });

    return { 
      topHabilidades, 
      modalidades: modalidades.map(m => ({ nombre: m.modalidad, count: m._count.id })),
      sectores: sectores.map(s => ({ nombre: s.sector, count: s._count.id })),
      filtros 
    };
  }

  async getDataReporteComparativoCohorte(filtros: FiltrosReporteComparativoCohorte) {
    const egresados = await this.prisma.egresado.findMany({
      select: {
        formacion_academica: {
          select: { fecha_fin: true },
          take: 1,
          orderBy: { fecha_fin: 'desc' }
        },
        postulaciones: {
          where: { estado: 'CONTRATADO' }
        }
      }
    });

    const cohortesMap = new Map();
    egresados.forEach(e => {
      const formacion = e.formacion_academica[0];
      const anio = formacion?.fecha_fin ? new Date(formacion.fecha_fin).getFullYear() : 'N/A';
      
      if (!cohortesMap.has(anio)) {
        cohortesMap.set(anio, { anio, total: 0, contratados: 0 });
      }
      const stats = cohortesMap.get(anio);
      stats.total++;
      if (e.postulaciones.length > 0) stats.contratados++;
    });

    const cohorte = Array.from(cohortesMap.values())
      .map(c => ({
        ...c,
        tasa: c.total > 0 ? ((c.contratados / c.total) * 100).toFixed(2) : '0.00'
      }))
      .sort((a, b) => (b.anio === 'N/A' ? -1 : a.anio === 'N/A' ? 1 : b.anio - a.anio));

    return { cohorte, filtros };
  }

  async getDataOperacional() {
    const [totalEgresados, totalEmpresas, totalOfertas, totalPostulaciones] = await Promise.all([
      this.prisma.egresado.count(),
      this.prisma.empresa.count(),
      this.prisma.ofertaLaboral.count({ where: { estado: 'activa' } }),
      this.prisma.postulacion.count(),
    ]);

    // Corazón del reporte: Listado principal operativo
    const listadoOperativo = await this.prisma.postulacion.findMany({
      take: 50,
      orderBy: { fecha_postulacion: 'desc' },
      include: {
        egresado: {
          include: {
            formacion_academica: {
              take: 1,
              orderBy: { fecha_fin: 'desc' }
            }
          }
        },
        oferta_laboral: {
          include: {
            empresa: true
          }
        }
      }
    });

    const listadoFormateado = listadoOperativo.map(p => {
      const formacion = p.egresado?.formacion_academica?.[0];
      const anioEgreso = formacion?.fecha_fin ? new Date(formacion.fecha_fin).getFullYear() : 'N/A';
      
      return {
        egresado: p.egresado ? `${p.egresado.nombres} ${p.egresado.apellidos}` : 'N/A',
        carrera: formacion?.titulo || 'N/A',
        anio_egreso: anioEgreso,
        empresa: p.oferta_laboral?.empresa?.nombre || 'N/A',
        oferta: p.oferta_laboral?.titulo || 'N/A',
        fecha_oferta: p.oferta_laboral?.creado_at || new Date(),
        estado_oferta: p.oferta_laboral?.estado || 'N/A',
        fecha_postulacion: p.fecha_postulacion || new Date(),
        estado_postulacion: p.estado || 'N/A'
      };
    });

    return { 
      totalEgresados, 
      totalEmpresas, 
      totalOfertas, 
      totalPostulaciones, 
      listado: listadoFormateado,
      fecha: new Date() 
    };
  }

  async getDataGestion() {
    const [
      totalEgresados,
      egresadosContratados,
      totalPostulaciones,
      totalOfertas,
      topHabilidades,
      empresasActivas
    ] = await Promise.all([
      this.prisma.egresado.count(),
      this.prisma.postulacion.count({ where: { estado: 'CONTRATADO' } }),
      this.prisma.postulacion.count(),
      this.prisma.ofertaLaboral.count(),
      this.prisma.$queryRaw<any[]>`
        SELECT h.nombre, COUNT(oh.id)::int as count 
        FROM habilidades h 
        JOIN oferta_habilidad oh ON h.id = oh.habilidad_id 
        GROUP BY h.nombre 
        ORDER BY count DESC 
        LIMIT 5`,
      this.prisma.empresa.count({ where: { usuario: { estado: true } } })
    ]);

    // Cálculos estratégicos
    const tasaEmpleabilidad = totalEgresados > 0 ? (egresadosContratados / totalEgresados) * 100 : 0;
    const promedioPostulacionesEgresado = totalEgresados > 0 ? (totalPostulaciones / totalEgresados) : 0;
    const tasaConversion = totalPostulaciones > 0 ? (egresadosContratados / totalPostulaciones) * 100 : 0;
    const promedioPostulacionesOferta = totalOfertas > 0 ? (totalPostulaciones / totalOfertas) : 0;

    // Distribución por carrera para Insights
    const distribucionCarrera = await this.prisma.carrera.findMany({
      include: {
        _count: {
          select: { formacion_academica: true }
        }
      }
    });

    return { 
      tasaEmpleabilidad: tasaEmpleabilidad.toFixed(2), 
      totalEgresados, 
      egresadosContratados,
      nivelActividadEmpresarial: empresasActivas,
      promedioPostulacionesEgresado: promedioPostulacionesEgresado.toFixed(1),
      tasaConversion: tasaConversion.toFixed(2),
      promedioPostulacionesOferta: promedioPostulacionesOferta.toFixed(1),
      topHabilidades,
      distribucionCarrera: distribucionCarrera.map(c => ({ nombre: c.nombre, total: c._count.formacion_academica })),
      fecha: new Date() 
    };
  }

  async generatePdfReport(tipo: string, data: any, parametros: any): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Colores
      const primaryColor = '#1e40af'; // Azul oscuro
      const secondaryColor = '#3b82f6'; // Azul medio
      const textColor = '#1f2937'; // Gris oscuro
      const lightGray = '#f3f4f6';

      // --- CABECERA ---
      doc.rect(0, 0, doc.page.width, 90).fill(primaryColor);
      doc.fillColor('#ffffff')
         .fontSize(18)
         .text('SISTEMA DE SEGUIMIENTO DE EGRESADOS', 50, 25, { align: 'left' });
      doc.fontSize(12)
         .text(`Reporte: ${this.getTipoLabel(tipo)}`, 50, 50, { align: 'left' });
      
      doc.fillColor('#ffffff')
         .fontSize(9)
         .text(`Generado el: ${new Date().toLocaleString()}`, 350, 50, { align: 'right', width: 200 });

      doc.moveDown(6);
      doc.fillColor(textColor);

      // --- CONTENIDO ---
      if (tipo === TipoReporte.OPERACIONAL) {
        doc.fontSize(14).fillColor(primaryColor).text('Resumen General del Sistema (KPIs)', 50, doc.y, { underline: true });
        doc.moveDown();
        this.drawStatsCards(doc, [
          { label: 'Egresados Reg.', value: data.totalEgresados },
          { label: 'Empresas Act.', value: data.totalEmpresas },
          { label: 'Ofertas Act.', value: data.totalOfertas },
          { label: 'Postulaciones', value: data.totalPostulaciones }
        ]);

        doc.moveDown(2);
        doc.fontSize(14).fillColor(primaryColor).text('Listado Maestro de Operaciones (Corazón del Reporte)', 50, doc.y, { underline: true });
        doc.moveDown();

        const tableData = data.listado.map((item: any) => [
          `${item.egresado}\n(${item.carrera})`,
          item.empresa,
          `${item.oferta}\n[${item.estado_oferta}]`,
          `${new Date(item.fecha_postulacion).toLocaleDateString()}\n{${item.estado_postulacion}}`
        ]);

        this.drawTable(doc, {
          headers: ['Egresado / Carrera', 'Empresa', 'Oferta / Estado', 'Postulación / Status'],
          rows: tableData,
          columnWidths: [140, 110, 140, 100]
        });

      } else if (tipo === TipoReporte.GESTION) {
        doc.fontSize(14).fillColor(primaryColor).text('Resumen Ejecutivo Estratégico', 50, doc.y, { underline: true });
        doc.moveDown();
        this.drawStatsCards(doc, [
          { label: 'Empleabilidad', value: `${data.tasaEmpleabilidad}%` },
          { label: 'Actividad Emp.', value: data.nivelActividadEmpresarial },
          { label: 'Tasa Conversión', value: `${data.tasaConversion}%` }
        ]);

        doc.moveDown(2);
        doc.fontSize(14).fillColor(primaryColor).text('Indicadores Estratégicos (Análisis Numérico)', 50, doc.y, { underline: true });
        doc.moveDown();
        
        const strategicData = [
          ['Promedio Postulaciones por Egresado', data.promedioPostulacionesEgresado],
          ['Tasa de Conversión (Postulación -> Contratación)', `${data.tasaConversion}%`],
          ['Promedio de Postulaciones por Oferta', data.promedioPostulacionesOferta],
          ['Egresados Contratados (Total)', data.egresadosContratados.toString()]
        ];

        this.drawTable(doc, {
          headers: ['Indicador Estratégico', 'Valor Calculado'],
          rows: strategicData,
          columnWidths: [300, 150]
        });

        doc.moveDown();
        doc.fontSize(14).fillColor(primaryColor).text('Insights y Tendencias (Interpretación)', 50, doc.y, { underline: true });
        doc.moveDown();

        // Generar Insights basados en datos
        const topCarrera = data.distribucionCarrera.sort((a: any, b: any) => b.total - a.total)[0];
        const topHabilidad = data.topHabilidades[0];

        doc.fontSize(10).fillColor(textColor);
        doc.text(`• El sector con mayor volumen de egresados es: ${topCarrera?.nombre || 'N/A'}.`, 50, doc.y, { bulletRadius: 2 });
        doc.text(`• Existe una demanda crítica de la habilidad: ${topHabilidad?.nombre || 'N/A'}.`, 50, doc.y, { bulletRadius: 2 });
        doc.text(`• La tasa de conversión actual del ${data.tasaConversion}% sugiere un nivel de ${parseFloat(data.tasaConversion) > 10 ? 'alta' : 'moderada'} efectividad en los procesos.`, 50, doc.y, { bulletRadius: 2 });
        
      } else if (tipo === TipoReporte.REPORTE_EMPLEABILIDAD) {
        doc.fontSize(14).fillColor(primaryColor).text('Análisis de Empleabilidad por Carrera', 50, doc.y, { underline: true });
        doc.moveDown();
        
        this.drawStatsCards(doc, [
          { label: 'Tasa General', value: `${data.tasaGeneral}%` },
          { label: 'Total Egresados', value: data.totalEgresados },
          { label: 'Total Contratados', value: data.egresadosContratados }
        ]);
        
        doc.moveDown();
        const tableData = data.dataPorCarrera.map((c: any) => [
          c.nombre,
          c.total.toString(),
          c.contratados.toString(),
          `${c.tasa}%`
        ]);

        this.drawTable(doc, {
          headers: ['Carrera Profesional', 'Total Egresados', 'Contratados', 'Tasa (%)'],
          rows: tableData,
          columnWidths: [200, 100, 100, 100]
        });
      } else if (tipo === TipoReporte.REPORTE_DEMANDA_LABORAL) {
        doc.fontSize(14).fillColor(primaryColor).text('Distribución de la Demanda Laboral', 50, doc.y, { underline: true });
        doc.moveDown();

        doc.fontSize(12).text('Distribución por Modalidad de Trabajo:', 50, doc.y);
        const modData = data.modalidades.map((m: any) => [m.nombre || 'No especificada', m.count.toString()]);
        this.drawTable(doc, {
          headers: ['Modalidad', 'Cantidad de Ofertas'],
          rows: modData,
          columnWidths: [300, 150]
        });

        doc.moveDown();
        doc.fontSize(12).text('Sectores Empresariales con Mayor Actividad:', 50, doc.y);
        const secData = data.sectores.map((s: any) => [s.nombre || 'Otros', s.count.toString()]);
        this.drawTable(doc, {
          headers: ['Sector Económico', 'Empresas Registradas'],
          rows: secData,
          columnWidths: [300, 150]
        });
      } else if (tipo === TipoReporte.REPORTE_COMPARATIVO_COHORTE) {
        doc.fontSize(14).fillColor(primaryColor).text('Comparativo de Empleabilidad por Cohorte (Año)', 50, doc.y, { underline: true });
        doc.moveDown();

        const tableData = data.cohorte.map((c: any) => [
          c.anio.toString(),
          c.total.toString(),
          c.contratados.toString(),
          `${c.tasa}%`
        ]);

        this.drawTable(doc, {
          headers: ['Año de Egreso', 'Total Egresados', 'Egresados con Empleo', 'Tasa de Éxito'],
          rows: tableData,
          columnWidths: [100, 120, 130, 100]
        });
      } else if (tipo === TipoReporte.LISTADO_EGRESADOS) {
        doc.fontSize(16).fillColor(primaryColor).text('Listado Detallado de Egresados', 50, doc.y);
        doc.moveDown();

        const tableData = data.egresados.map((e: any) => [
          `${e.nombres} ${e.apellidos}`,
          e.usuario.email,
          e.formacion_academica?.[0]?.titulo || 'N/A',
          e.buscando_empleo ? 'Sí' : 'No'
        ]);

        this.drawTable(doc, {
          headers: ['Nombre Completo', 'Email', 'Título/Carrera', 'Buscando'],
          rows: tableData,
          columnWidths: [150, 150, 150, 60]
        });
      } else if (tipo === TipoReporte.LISTADO_OFERTAS) {
        doc.fontSize(16).fillColor(primaryColor).text('Listado de Ofertas Laborales', 50, doc.y);
        doc.moveDown();

        const tableData = data.ofertas.map((o: any) => [
          o.titulo,
          o.empresa.nombre,
          o.ciudad || 'N/A',
          o.estado,
          o._count.postulaciones.toString()
        ]);

        this.drawTable(doc, {
          headers: ['Título', 'Empresa', 'Ciudad', 'Estado', 'Post.'],
          rows: tableData,
          columnWidths: [140, 120, 100, 70, 40]
        });
      } else if (tipo === TipoReporte.POSTULACIONES_POR_OFERTA) {
        if (data.oferta) {
          doc.fontSize(16).fillColor(primaryColor).text(`Postulaciones: ${data.oferta.titulo}`, 50, doc.y);
          doc.fontSize(12).fillColor(textColor).text(`Empresa: ${data.oferta.empresa.nombre}`, 50, doc.y);
          doc.moveDown();
        }

        const tableData = data.postulaciones.map((p: any) => [
          `${p.egresado.nombres} ${p.egresado.apellidos}`,
          new Date(p.fecha_postulacion).toLocaleDateString(),
          p.estado
        ]);

        this.drawTable(doc, {
          headers: ['Candidato', 'Fecha Postulación', 'Estado Actual'],
          rows: tableData,
          columnWidths: [200, 150, 120]
        });
      } else {
        doc.text('Resumen de datos:', 50, doc.y, { underline: true });
        doc.fontSize(10).text(JSON.stringify(data, null, 2), 50, doc.y);
      }

      // --- PIE DE PÁGINA ---
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.rect(0, doc.page.height - 50, doc.page.width, 50).fill(lightGray);
        doc.fillColor('#6b7280')
           .fontSize(9)
           .text(
             `Página ${i + 1} de ${range.count} | Generado por el Sistema de Egresados | © ${new Date().getFullYear()}`,
             0,
             doc.page.height - 30,
             { align: 'center' }
           );
      }

      doc.end();
    });
  }

  private getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      OPERACIONAL: 'Reporte Operacional',
      GESTION: 'Reporte de Gestión y Empleabilidad',
      LISTADO_EGRESADOS: 'Listado de Egresados',
      LISTADO_OFERTAS: 'Listado de Ofertas Laborales',
      POSTULACIONES_POR_OFERTA: 'Detalle de Postulaciones',
      REPORTE_EMPLEABILIDAD: 'Análisis de Empleabilidad',
      REPORTE_DEMANDA_LABORAL: 'Demanda Laboral y Habilidades',
      REPORTE_COMPARATIVO_COHORTE: 'Comparativo por Cohorte'
    };
    return labels[tipo] || tipo;
  }

  private drawStatsCards(doc: any, stats: { label: string; value: any }[]) {
    const cardWidth = 120;
    const cardHeight = 60;
    const spacing = 15;
    let x = 50;
    let y = doc.y;

    stats.forEach(stat => {
      doc.rect(x, y, cardWidth, cardHeight)
         .fillAndStroke('#f9fafb', '#e5e7eb');
      
      doc.fillColor('#6b7280').fontSize(9).text(stat.label, x + 5, y + 10, { width: cardWidth - 10, align: 'center' });
      doc.fillColor('#111827').fontSize(14).text(stat.value.toString(), x + 5, y + 30, { width: cardWidth - 10, align: 'center' });
      
      x += cardWidth + spacing;
    });
    
    doc.y = y + cardHeight + 20;
  }

  private drawTable(doc: any, table: { headers: string[], rows: string[][], columnWidths: number[] }) {
    const startX = 50;
    let currentY = doc.y;
    const rowHeight = 25;
    const headerColor = '#f3f4f6';

    // Headers
    doc.rect(startX, currentY, table.columnWidths.reduce((a, b) => a + b, 0), rowHeight)
       .fill(headerColor);
    
    doc.fillColor('#374151').fontSize(10);
    let currentX = startX;
    table.headers.forEach((header, i) => {
      doc.text(header, currentX + 5, currentY + 7, { width: table.columnWidths[i] - 10, bold: true });
      currentX += table.columnWidths[i];
    });

    currentY += rowHeight;
    doc.fillColor('#1f2937').fontSize(9);

    // Rows
    table.rows.forEach((row, rowIndex) => {
      // Check for page break
      if (currentY + rowHeight > doc.page.height - 70) {
        doc.addPage();
        currentY = 50;
        
        // Redraw headers on new page
        doc.rect(startX, currentY, table.columnWidths.reduce((a, b) => a + b, 0), rowHeight).fill(headerColor);
        doc.fillColor('#374151').fontSize(10);
        let tempX = startX;
        table.headers.forEach((header, i) => {
          doc.text(header, tempX + 5, currentY + 7, { width: table.columnWidths[i] - 10 });
          tempX += table.columnWidths[i];
        });
        currentY += rowHeight;
        doc.fillColor('#1f2937').fontSize(9);
      }

      // Alternate background
      if (rowIndex % 2 === 0) {
        doc.rect(startX, currentY, table.columnWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#ffffff');
      } else {
        doc.rect(startX, currentY, table.columnWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#f9fafb');
      }

      let rowX = startX;
      row.forEach((cell, i) => {
        doc.text(cell || '', rowX + 5, currentY + 7, { width: table.columnWidths[i] - 10 });
        rowX += table.columnWidths[i];
      });

      // Borders
      doc.rect(startX, currentY, table.columnWidths.reduce((a, b) => a + b, 0), rowHeight).stroke('#e5e7eb');

      currentY += rowHeight;
    });

    doc.y = currentY + 20;
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
