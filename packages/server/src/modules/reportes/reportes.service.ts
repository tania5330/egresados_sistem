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

interface ReporteResponse {
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
    const reporte = await this.prisma.reporte.findUnique({
      where: { id },
    });

    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    return this.mapReporteResponse(reporte);
  }

  async getMisReportes(usuarioId: string, filters: FilterReporteDto): Promise<{
    data: ReporteResponse[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const where: any = { usuario_id: usuarioId };

    if (filters.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters.estado) {
      where.estado = filters.estado;
    }

    if (filters.fechaDesde) {
      where.created_at = { ...where.created_at, gte: new Date(filters.fechaDesde) };
    }

    if (filters.fechaHasta) {
      where.created_at = { ...where.created_at, lte: new Date(filters.fechaHasta) };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [reportes, total] = await Promise.all([
      this.prisma.reporte.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.reporte.count({ where }),
    ]);

    return {
      data: reportes.map(r => this.mapReporteResponse(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEstadoReporte(reporteId: string): Promise<{
    estado: string;
    progreso: number;
    archivoUrl: string | null;
    errorMensaje: string | null;
  }> {
    const reporte = await this.prisma.reporte.findUnique({
      where: { id: reporteId },
      select: { id: true, estado: true, archivo_url: true, error_mensaje: true },
    });

    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    const jobStatus = await this.reportesQueue.getJobStatus(reporteId);

    return {
      estado: reporte.estado as string,
      progreso: reporte.estado === EstadoReporte.COMPLETADO ? 100 :
                reporte.estado === EstadoReporte.ERROR ? 0 :
                jobStatus.progress,
      archivoUrl: reporte.archivo_url,
      errorMensaje: reporte.error_mensaje,
    };
  }

  async cancelarReporte(reporteId: string, usuarioId: string): Promise<boolean> {
    const reporte = await this.prisma.reporte.findUnique({
      where: { id: reporteId },
    });

    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (reporte.usuario_id !== usuarioId) {
      throw new NotFoundException('No tiene permisos para cancelar este reporte');
    }

    if (reporte.estado !== EstadoReporte.PENDIENTE && reporte.estado !== EstadoReporte.PROCESANDO) {
      return false;
    }

    const cancelled = await this.reportesQueue.cancelJob(reporteId);

    if (cancelled) {
      await this.prisma.reporte.update({
        where: { id: reporteId },
        data: {
          estado: EstadoReporte.ERROR,
          error_mensaje: 'Cancelado por el usuario',
          fecha_fin: new Date(),
        },
      });
    }

    return cancelled;
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

  async getDataListadoEgresados(filtros: FiltrosListadoEgresados) {
    const where: any = {};

    if (filtros.carreraIds?.length) {
      where.formacion_academica = {
        some: { carrera_id: { in: filtros.carreraIds } },
      };
    }

    if (filtros.habilidadIds?.length) {
      where.egresado_habilidad = {
        some: { habilidad_id: { in: filtros.habilidadIds } },
      };
    }

    if (filtros.soloBuscandoEmpleo !== undefined) {
      where.buscando_empleo = filtros.soloBuscandoEmpleo;
    }

    if (filtros.anioEgresoDesde || filtros.anioEgresoHasta) {
      where.formacion_academica = {
        ...where.formacion_academica,
        some: {
          culminada: true,
          fecha_fin: {
            ...(filtros.anioEgresoDesde && {
              gte: new Date(filtros.anioEgresoDesde, 0, 1),
            }),
            ...(filtros.anioEgresoHasta && {
              lte: new Date(filtros.anioEgresoHasta, 11, 31),
            }),
          },
        },
      };
    }

    const egresados = await this.prisma.egresado.findMany({
      where,
      include: {
        user: { select: { email: true } },
        formacion_academica: {
          include: { carrera: { include: { facultad: true } } },
        },
        experiencia_laboral: true,
        egresado_habilidad: {
          include: { habilidad: true },
        },
      },
    });

    return { egresados, filtros };
  }

  async getDataListadoOfertas(filtros: FiltrosListadoOfertas) {
    const where: any = {};

    if (filtros.activa !== undefined) where.activa = filtros.activa;
    if (filtros.ciudad) where.ciudad = { contains: filtros.ciudad, mode: 'insensitive' };
    if (filtros.pais) where.pais = { contains: filtros.pais, mode: 'insensitive' };
    if (filtros.modalidad) where.modalidad = filtros.modalidad;
    if (filtros.tipoContrato) where.tipo_contrato = filtros.tipoContrato;
    if (filtros.salarioMin) where.salario_min = { gte: filtros.salarioMin };
    if (filtros.salarioMax) where.salario_max = { lte: filtros.salarioMax };

    if (filtros.habilidadIds?.length) {
      where.oferta_habilidad = {
        some: { habilidad_id: { in: filtros.habilidadIds } },
      };
    }

    if (filtros.fechaPublicacionDesde) {
      where.created_at = { ...where.created_at, gte: new Date(filtros.fechaPublicacionDesde) };
    }
    if (filtros.fechaPublicacionHasta) {
      where.created_at = { ...where.created_at, lte: new Date(filtros.fechaPublicacionHasta) };
    }

    const ofertas = await this.prisma.ofertaLaboral.findMany({
      where,
      include: {
        empresa: true,
        oferta_habilidad: {
          include: { habilidad: true },
        },
        _count: { select: { postulaciones: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return { ofertas, filtros };
  }

  async getDataPostulacionesPorOferta(filtros: FiltrosPostulacionesPorOferta) {
    const where: any = { oferta_id: filtros.ofertaId };
    if (filtros.estado) where.estado = filtros.estado;

    const postulaciones = await this.prisma.postulacion.findMany({
      where,
      include: {
        egresado: {
          include: {
            user: { select: { email: true } },
            formacion_academica: {
              include: { carrera: true },
            },
            egresado_habilidad: {
              include: { habilidad: true },
            },
          },
        },
        oferta: { include: { empresa: true } },
        postulacion_historial: {
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { fecha_postulacion: 'desc' },
    });

    const oferta = await this.prisma.ofertaLaboral.findUnique({
      where: { id: filtros.ofertaId },
      include: { empresa: true },
    });

    return { postulaciones, oferta, filtros };
  }

  async getDataReporteEmpleabilidad(filtros: FiltrosReporteEmpleabilidad) {
    const where: any = {};

    if (filtros.carreraIds?.length) {
      where.formacion_academica = {
        some: { carrera_id: { in: filtros.carreraIds } },
      };
    }

    const egresados = await this.prisma.egresado.findMany({
      where,
      include: {
        formacion_academica: {
          include: { carrera: { include: { facultad: true } } },
        },
        postulaciones: {
          where: { estado: 'CONTRATADO' },
        },
      },
    });

    const byCarrera: Record<string, any> = {};
    const byAnio: Record<number, any> = {};

    for (const egreso of egresados) {
      const carrera = egreso.formacion_academica[0]?.carrera;
      const anio = egreso.formacion_academica[0]?.fecha_fin?.getFullYear();

      if (carrera) {
        if (!byCarrera[carrera.id]) {
          byCarrera[carrera.id] = {
            carrera: carrera.nombre,
            facultad: carrera.facultad?.nombre,
            total: 0,
            empleados: 0,
          };
        }
        byCarrera[carrera.id].total++;
        if (egreso.postulaciones.length > 0) {
          byCarrera[carrera.id].empleados++;
        }
      }

      if (anio) {
        if (!byAnio[anio]) {
          byAnio[anio] = { anio, total: 0, empleados: 0 };
        }
        byAnio[anio].total++;
        if (egreso.postulaciones.length > 0) {
          byAnio[anio].empleados++;
        }
      }
    }

    return {
      porCarrera: Object.values(byCarrera),
      porAnio: Object.values(byAnio).sort((a, b) => a.anio - b.anio),
      filtros,
    };
  }

  async getDataReporteDemandaLaboral(filtros: FiltrosReporteDemandaLaboral) {
    const where: any = { activa: true };

    if (filtros.fechaDesde) {
      where.created_at = { ...where.created_at, gte: new Date(filtros.fechaDesde) };
    }
    if (filtros.fechaHasta) {
      where.created_at = { ...where.created_at, lte: new Date(filtros.fechaHasta) };
    }

    const ofertas = await this.prisma.ofertaLaboral.findMany({
      where,
      include: {
        empresa: { select: { sector: true } },
        oferta_habilidad: {
          include: { habilidad: true },
        },
      },
    });

    const habilidadesMap: Record<string, any> = {};
    const sectoresMap: Record<string, any> = {};
    const modalidadesMap: Record<string, number> = {};
    const contratosMap: Record<string, number> = {};

    for (const oferta of ofertas) {
      for (const oh of oferta.oferta_habilidad) {
        const h = oh.habilidad;
        if (!habilidadesMap[h.id]) {
          habilidadesMap[h.id] = {
            id: h.id,
            nombre: h.nombre,
            tipo: h.tipo,
            categoria: h.categoria,
            totalOfertas: 0,
            obligatoria: 0,
            deseable: 0,
          };
        }
        habilidadesMap[h.id].totalOfertas++;
        if (oh.obligatoria) habilidadesMap[h.id].obligatoria++;
        else habilidadesMap[h.id].deseable++;
      }

      if (oferta.empresa.sector) {
        if (!sectoresMap[oferta.empresa.sector]) {
          sectoresMap[oferta.empresa.sector] = {
            sector: oferta.empresa.sector,
            totalOfertas: 0,
          };
        }
        sectoresMap[oferta.empresa.sector].totalOfertas++;
      }

      modalidadesMap[oferta.modalidad] = (modalidadesMap[oferta.modalidad] || 0) + 1;
      contratosMap[oferta.tipo_contrato] = (contratosMap[oferta.tipo_contrato] || 0) + 1;
    }

    const topHabilidades = Object.values(habilidadesMap)
      .sort((a: any, b: any) => b.totalOfertas - a.totalOfertas)
      .slice(0, filtros.topHabilidades || 20);

    return {
      topHabilidades,
      sectores: Object.values(sectoresMap).sort((a: any, b: any) => b.totalOfertas - a.totalOfertas),
      porModalidad: Object.entries(modalidadesMap).map(([modalidad, total]) => ({ modalidad, total })),
      porTipoContrato: Object.entries(contratosMap).map(([tipo, total]) => ({ tipo, total })),
      filtros,
    };
  }

  async getDataReporteComparativoCohorte(filtros: FiltrosReporteComparativoCohorte) {
    const where: any = {
      culminada: true,
      fecha_fin: {
        gte: new Date(filtros.anioDesde, 0, 1),
        lte: new Date(filtros.anioHasta, 11, 31),
      },
    };

    if (filtros.carreraIds?.length) {
      where.carrera_id = { in: filtros.carreraIds };
    }

    const carreras = await this.prisma.carrera.findMany({
      where: filtros.carreraIds ? { id: { in: filtros.carreraIds } } : undefined,
      select: { id: true, nombre: true },
    });

    const cohorteData: Record<number, Record<string, any>> = {};

    for (let year = filtros.anioDesde; year <= filtros.anioHasta; year++) {
      cohorteData[year] = {};
      for (const carrera of carreras) {
        cohorteData[year][carrera.id] = {
          anio: year,
          carrera: carrera.nombre,
          carreraId: carrera.id,
          totalEgresados: 0,
          contratados: 0,
          tasaContratacion: 0,
        };
      }
    }

    const formaciones = await this.prisma.formacionAcademica.findMany({
      where,
      include: {
        egresado: {
          include: { postulaciones: { where: { estado: 'CONTRATADO' } } },
        },
        carrera: true,
      },
    });

    for (const formacion of formaciones) {
      const anio = formacion.fecha_fin?.getFullYear();
      if (anio && cohorteData[anio] && formacion.carreraId) {
        const carreraData = cohorteData[anio][formacion.carreraId];
        if (carreraData) {
          carreraData.totalEgresados++;
          if (formacion.egresado.postulaciones.length > 0) {
            carreraData.contratados++;
          }
        }
      }
    }

    for (const year of Object.keys(cohorteData)) {
      for (const carreraId of Object.keys(cohorteData[parseInt(year)])) {
        const data = cohorteData[parseInt(year)][carreraId];
        if (data.totalEgresados > 0) {
          data.tasaContratacion = Number(((data.contratados / data.totalEgresados) * 100).toFixed(2));
        }
      }
    }

    return {
      cohorte: Object.entries(cohorteData).flatMap(([year, carreras]) =>
        Object.values(carreras),
      ),
      filtros,
    };
  }

  async generatePdfReport(
    tipo: string,
    data: any,
    parametros: Record<string, any>,
  ): Promise<Buffer> {
    const html = this.generateHtmlReport(tipo, data, parametros);

    return this.convertHtmlToPdf(html);
  }

  private generateHtmlReport(tipo: string, data: any, parametros: any): string {
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #3498db; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .header { margin-bottom: 30px; }
        .meta { color: #7f8c8d; font-size: 12px; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 11px; }
        .badge-contratado { background: #27ae60; color: white; }
        .badge-postulado { background: #3498db; color: white; }
        .badge-en-revision { background: #f39c12; color: white; }
        .badge-rechazado { background: #e74c3c; color: white; }
        .summary { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .summary-item { text-align: center; }
        .summary-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .summary-label { font-size: 11px; color: #7f8c8d; }
      </style>
    `;

    let content = '';

    switch (tipo) {
      case 'LISTADO_EGRESADOS':
        content = this.generateListadoEgresadosHtml(data);
        break;
      case 'LISTADO_OFERTAS':
        content = this.generateListadoOfertasHtml(data);
        break;
      case 'POSTULACIONES_POR_OFERTA':
        content = this.generatePostulacionesHtml(data);
        break;
      case 'REPORTE_EMPLEABILIDAD':
        content = this.generateEmpleabilidadHtml(data);
        break;
      case 'REPORTE_DEMANDA_LABORAL':
        content = this.generateDemandaLaboralHtml(data);
        break;
      case 'REPORTE_COMPARATIVO_COHORTE':
        content = this.generateComparativoCohorteHtml(data);
        break;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${styles}
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
  }

  private generateListadoEgresadosHtml(data: any): string {
    const { egresados, filtros } = data;
    const total = egresados.length;
    const empleados = egresados.filter((e: any) => e.postulaciones?.some((p: any) => p.estado === 'CONTRATADO')).length;

    let tableRows = '';
    for (const egreso of egresados) {
      const carrera = egreso.formacion_academica[0]?.carrera?.nombre || 'N/A';
      const habilidades = egreso.egresado_habilidad?.map((eh: any) => eh.habilidad.nombre).join(', ') || 'Ninguna';
      const experiencia = egreso.experiencia_laboral?.length || 0;

      tableRows += `
        <tr>
          <td>${egreso.nombres} ${egreso.apellidos}</td>
          <td>${egreso.user?.email || 'N/A'}</td>
          <td>${carrera}</td>
          <td>${habilidades}</td>
          <td>${experiencia}</td>
          <td>${egreso.buscando_empleo ? 'Sí' : 'No'}</td>
        </tr>
      `;
    }

    return `
      <div class="header">
        <h1>Reporte de Listado de Egresados</h1>
        <p class="meta">Generado: ${new Date().toLocaleString()}</p>
      </div>

      <div class="summary">
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">${total}</div>
            <div class="summary-label">Total Egresados</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${empleados}</div>
            <div class="summary-label">Empleados</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${total > 0 ? ((empleados / total) * 100).toFixed(1) : 0}%</div>
            <div class="summary-label">Tasa de Empleo</div>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Carrera</th>
            <th>Habilidades</th>
            <th>Experiencia</th>
            <th>Buscando Empleo</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  }

  private generateListadoOfertasHtml(data: any): string {
    const { ofertas, filtros } = data;
    const total = ofertas.length;

    let tableRows = '';
    for (const oferta of ofertas) {
      tableRows += `
        <tr>
          <td>${oferta.titulo}</td>
          <td>${oferta.empresa?.nombre || 'N/A'}</td>
          <td>${oferta.ciudad || 'N/A'}</td>
          <td>${oferta.modalidad}</td>
          <td>${oferta.tipo_contrato}</td>
          <td>${oferta.salario_min ? `$${oferta.salario_min}` : 'N/A'} - ${oferta.salario_max ? `$${oferta.salario_max}` : 'N/A'}</td>
          <td>${oferta._count?.postulaciones || 0}</td>
        </tr>
      `;
    }

    return `
      <div class="header">
        <h1>Reporte de Listado de Ofertas Laborales</h1>
        <p class="meta">Generado: ${new Date().toLocaleString()}</p>
      </div>

      <div class="summary">
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">${total}</div>
            <div class="summary-label">Total Ofertas</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${ofertas.filter((o: any) => o.activa).length}</div>
            <div class="summary-label">Activas</div>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Empresa</th>
            <th>Ciudad</th>
            <th>Modalidad</th>
            <th>Tipo Contrato</th>
            <th>Salario</th>
            <th>Postulaciones</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  }

  private generatePostulacionesHtml(data: any): string {
    const { postulaciones, oferta, filtros } = data;
    const total = postulaciones.length;

    let tableRows = '';
    for (const postulacion of postulaciones) {
      const estadoClass = `badge-${postulacion.estado.toLowerCase().replace('_', '-')}`;
      tableRows += `
        <tr>
          <td>${postulacion.egresado?.nombres} ${postulacion.egresado?.apellidos}</td>
          <td>${postulacion.egresado?.user?.email || 'N/A'}</td>
          <td>${postulacion.egresado?.formacion_academica[0]?.carrera?.nombre || 'N/A'}</td>
          <td><span class="badge ${estadoClass}">${postulacion.estado}</span></td>
          <td>${new Date(postulacion.fecha_postulacion).toLocaleDateString()}</td>
        </tr>
      `;
    }

    return `
      <div class="header">
        <h1>Reporte de Postulaciones</h1>
        <p class="meta">Oferta: ${oferta?.titulo || 'N/A'} - ${oferta?.empresa?.nombre || 'N/A'}</p>
        <p class="meta">Generado: ${new Date().toLocaleString()}</p>
      </div>

      <div class="summary">
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">${total}</div>
            <div class="summary-label">Total Postulaciones</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${postulaciones.filter((p: any) => p.estado === 'CONTRATADO').length}</div>
            <div class="summary-label">Contratados</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${postulaciones.filter((p: any) => p.estado === 'ENTREVISTA').length}</div>
            <div class="summary-label">En Entrevista</div>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Carrera</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  }

  private generateEmpleabilidadHtml(data: any): string {
    const { porCarrera, porAnio, filtros } = data;

    let carreraRows = '';
    for (const item of porCarrera) {
      carreraRows += `
        <tr>
          <td>${item.carrera}</td>
          <td>${item.facultad || 'N/A'}</td>
          <td>${item.total}</td>
          <td>${item.empleados}</td>
          <td>${item.total > 0 ? ((item.empleados / item.total) * 100).toFixed(1) : 0}%</td>
        </tr>
      `;
    }

    let anioRows = '';
    for (const item of porAnio) {
      anioRows += `
        <tr>
          <td>${item.anio}</td>
          <td>${item.total}</td>
          <td>${item.empleados}</td>
          <td>${item.total > 0 ? ((item.empleados / item.total) * 100).toFixed(1) : 0}%</td>
        </tr>
      `;
    }

    return `
      <div class="header">
        <h1>Reporte de Empleabilidad</h1>
        <p class="meta">Generado: ${new Date().toLocaleString()}</p>
      </div>

      <h2>Por Carrera</h2>
      <table>
        <thead>
          <tr>
            <th>Carrera</th>
            <th>Facultad</th>
            <th>Total Egresados</th>
            <th>Empleados</th>
            <th>Tasa de Empleo</th>
          </tr>
        </thead>
        <tbody>
          ${carreraRows}
        </tbody>
      </table>

      <h2>Por Año de Egreso</h2>
      <table>
        <thead>
          <tr>
            <th>Año</th>
            <th>Total Egresados</th>
            <th>Empleados</th>
            <th>Tasa de Empleo</th>
          </tr>
        </thead>
        <tbody>
          ${anioRows}
        </tbody>
      </table>
    `;
  }

  private generateDemandaLaboralHtml(data: any): string {
    const { topHabilidades, sectores, porModalidad, porTipoContrato, filtros } = data;

    let habilidadRows = '';
    for (const h of topHabilidades) {
      habilidadRows += `
        <tr>
          <td>${h.nombre}</td>
          <td>${h.tipo}</td>
          <td>${h.categoria || 'N/A'}</td>
          <td>${h.totalOfertas}</td>
          <td>${h.obligatoria}</td>
          <td>${h.deseable}</td>
        </tr>
      `;
    }

    let sectorRows = '';
    for (const s of sectores) {
      sectorRows += `
        <tr>
          <td>${s.sector}</td>
          <td>${s.totalOfertas}</td>
        </tr>
      `;
    }

    return `
      <div class="header">
        <h1>Reporte de Demanda Laboral</h1>
        <p class="meta">Generado: ${new Date().toLocaleString()}</p>
      </div>

      <h2>Top Habilidades Demandadas</h2>
      <table>
        <thead>
          <tr>
            <th>Habilidad</th>
            <th>Tipo</th>
            <th>Categoría</th>
            <th>Total Ofertas</th>
            <th>Obligatorias</th>
            <th>Deseables</th>
          </tr>
        </thead>
        <tbody>
          ${habilidadRows}
        </tbody>
      </table>

      <h2>Sectores con Mayor Oferta</h2>
      <table>
        <thead>
          <tr>
            <th>Sector</th>
            <th>Total Ofertas</th>
          </tr>
        </thead>
        <tbody>
          ${sectorRows}
        </tbody>
      </table>
    `;
  }

  private generateComparativoCohorteHtml(data: any): string {
    const { cohorte, filtros } = data;

    const groupedByYear: Record<number, any[]> = {};
    for (const item of cohorte) {
      if (!groupedByYear[item.anio]) {
        groupedByYear[item.anio] = [];
      }
      groupedByYear[item.anio].push(item);
    }

    let content = `
      <div class="header">
        <h1>Reporte Comparativo por Cohorte</h1>
        <p class="meta">Período: ${filtros.anioDesde} - ${filtros.anioHasta}</p>
        <p class="meta">Generado: ${new Date().toLocaleString()}</p>
      </div>
    `;

    const years = Object.keys(groupedByYear).sort();
    for (const year of years) {
      const items = groupedByYear[parseInt(year)];
      let rows = '';
      for (const item of items) {
        rows += `
          <tr>
            <td>${item.carrera}</td>
            <td>${item.totalEgresados}</td>
            <td>${item.contratados}</td>
            <td>${item.tasaContratacion}%</td>
          </tr>
        `;
      }

      content += `
        <h2>Cohorte ${year}</h2>
        <table>
          <thead>
            <tr>
              <th>Carrera</th>
              <th>Total Egresados</th>
              <th>Contratados</th>
              <th>Tasa de Contratación</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    }

    return content;
  }

  private async convertHtmlToPdf(html: string): Promise<Buffer> {
    const puppeteer = require('puppeteer');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });

    await browser.close();

    return Buffer.from(buffer);
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
      createdAt: reporte.created_at,
      parametros: reporte.parametros || {},
    };
  }
}