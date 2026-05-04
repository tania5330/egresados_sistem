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
      doc.rect(0, 0, doc.page.width, 80).fill(primaryColor);
      doc.fillColor('#ffffff')
         .fontSize(22)
         .text('SISTEMA DE SEGUIMIENTO DE EGRESADOS', 50, 25, { align: 'left' });
      doc.fontSize(14)
         .text(`Reporte: ${this.getTipoLabel(tipo)}`, 50, 52, { align: 'left' });
      
      doc.fillColor('#ffffff')
         .fontSize(10)
         .text(`Generado el: ${new Date().toLocaleString()}`, 50, 25, { align: 'right' });

      doc.moveDown(4);
      doc.fillColor(textColor);

      // --- CONTENIDO ---
      if (tipo === TipoReporte.OPERACIONAL) {
        this.drawStatsCards(doc, [
          { label: 'Total Egresados', value: data.totalEgresados },
          { label: 'Total Empresas', value: data.totalEmpresas },
          { label: 'Total Ofertas', value: data.totalOfertas },
          { label: 'Total Postulaciones', value: data.totalPostulaciones }
        ]);
      } else if (tipo === TipoReporte.GESTION) {
        this.drawStatsCards(doc, [
          { label: 'Tasa Empleabilidad', value: `${data.tasaEmpleabilidad}%` },
          { label: 'Egresados Contratados', value: data.egresadosContratados },
          { label: 'Total Egresados', value: data.totalEgresados }
        ]);

        doc.moveDown(2);
        doc.fontSize(16).fillColor(primaryColor).text('Top Habilidades Demandadas', { underline: true });
        doc.moveDown();
        
        const tableData = data.topHabilidades.map((h: any, i: number) => [
          (i + 1).toString(),
          h.nombre,
          h.count.toString()
        ]);
        
        this.drawTable(doc, {
          headers: ['#', 'Habilidad', 'Menciones'],
          rows: tableData,
          columnWidths: [40, 300, 100]
        });
      } else if (tipo === TipoReporte.LISTADO_EGRESADOS) {
        doc.fontSize(16).fillColor(primaryColor).text('Listado Detallado de Egresados');
        doc.moveDown();

        const tableData = data.egresados.map((e: any) => [
          `${e.nombres} ${e.apellidos}`,
          e.usuario.email,
          e.formacion_academica?.[0]?.carrera?.nombre || 'N/A',
          e.buscando_empleo ? 'Sí' : 'No'
        ]);

        this.drawTable(doc, {
          headers: ['Nombre Completo', 'Email', 'Carrera', 'Buscando'],
          rows: tableData,
          columnWidths: [150, 150, 150, 60]
        });
      } else if (tipo === TipoReporte.LISTADO_OFERTAS) {
        doc.fontSize(16).fillColor(primaryColor).text('Listado de Ofertas Laborales');
        doc.moveDown();

        const tableData = data.ofertas.map((o: any) => [
          o.titulo,
          o.empresa.nombre_comercial,
          o.ciudad,
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
          doc.fontSize(16).fillColor(primaryColor).text(`Postulaciones: ${data.oferta.titulo}`);
          doc.fontSize(12).fillColor(textColor).text(`Empresa: ${data.oferta.empresa.nombre_comercial}`);
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
        doc.text('Resumen de datos:', { underline: true });
        doc.fontSize(10).text(JSON.stringify(data, null, 2));
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
