import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { ReportesQueue, ReporteJobData } from './reportes.queue';
import { ReportesService } from './reportes.service';
import { EstadoReporte } from './dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
@Processor('reportes')
export class ReportesProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportesProcessor.name);

  constructor(
    private readonly reportesService: ReportesService,
    private readonly reportesQueue: ReportesQueue,
  ) {
    super();
  }

  async process(job: Job<ReporteJobData>): Promise<void> {
    const { reporteId, usuarioId, tipo, parametros } = job.data;

    this.logger.log(`Processing reporte ${reporteId} of type ${tipo}`);

    try {
      await this.reportesService.updateReporteEstado(reporteId, EstadoReporte.PROCESANDO);

      await job.updateProgress(10);

      const data = await this.fetchDataForReport(tipo, parametros);

      await job.updateProgress(40);

      const pdfBuffer = await this.generatePdf(tipo, data, parametros);

      await job.updateProgress(70);

      const fileUrl = await this.savePdf(pdfBuffer, usuarioId, reporteId);

      await job.updateProgress(90);

      await this.reportesService.updateReporteCompletado(reporteId, fileUrl);

      await job.updateProgress(100);

      this.logger.log(`Reporte ${reporteId} completed successfully`);
    } catch (error) {
      this.logger.error(`Error processing reporte ${reporteId}: ${error.message}`, error.stack);

      await this.reportesService.updateReporteError(reporteId, error.message);

      throw error;
    }
  }

  private async fetchDataForReport(
    tipo: string,
    parametros: Record<string, any>,
  ): Promise<any> {
    switch (tipo) {
      case 'OPERACIONAL':
        return this.reportesService.getDataOperacional();
      case 'GESTION':
        return this.reportesService.getDataGestion();
      case 'LISTADO_EGRESADOS':
        return this.reportesService.getDataListadoEgresados(parametros as any);
      case 'LISTADO_OFERTAS':
        return this.reportesService.getDataListadoOfertas(parametros as any);
      case 'POSTULACIONES_POR_OFERTA':
        return this.reportesService.getDataPostulacionesPorOferta(parametros as any);
      case 'REPORTE_EMPLEABILIDAD':
        return this.reportesService.getDataReporteEmpleabilidad(parametros as any);
      case 'REPORTE_DEMANDA_LABORAL':
        return this.reportesService.getDataReporteDemandaLaboral(parametros as any);
      case 'REPORTE_COMPARATIVO_COHORTE':
        return this.reportesService.getDataReporteComparativoCohorte(parametros as any);
      default:
        throw new Error(`Unknown report type: ${tipo}`);
    }
  }

  private async generatePdf(
    tipo: string,
    data: any,
    parametros: Record<string, any>,
  ): Promise<Buffer> {
    return this.reportesService.generatePdfReport(tipo, data, parametros);
  }

  private async savePdf(
    buffer: Buffer,
    usuarioId: string,
    reporteId: string,
  ): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'reportes', usuarioId);

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, `${reporteId}.pdf`);
    fs.writeFileSync(filePath, buffer);

    return `/uploads/reportes/${usuarioId}/${reporteId}.pdf`;
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<ReporteJobData>) {
    this.logger.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ReporteJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job<ReporteJobData>, progress: number | object) {
    this.logger.debug(`Job ${job.id} progress: ${JSON.stringify(progress)}`);
  }
}