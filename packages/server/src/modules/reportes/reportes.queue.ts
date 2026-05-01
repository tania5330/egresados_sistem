import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Queue, QueueEvents, JobsOptions } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

export interface ReporteJobData {
  reporteId: string;
  usuarioId: string;
  tipo: string;
  parametros: Record<string, any>;
}

export enum ReporteQueueEvents {
  COMPLETED = 'completed',
  FAILED = 'failed',
  PROGRESS = 'progress',
}

@Injectable()
export class ReportesQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportesQueue.name);
  private queue: Queue;
  private queueEvents: QueueEvents;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const connection = await this.getConnection();

    this.queue = new Queue('reportes', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          count: 100,
          age: 24 * 3600,
        },
        removeOnFail: {
          count: 500,
          age: 7 * 24 * 3600,
        },
      },
    });

    this.queueEvents = new QueueEvents('reportes', { connection });

    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      this.logger.log(`Job ${jobId} completed with result: ${returnvalue}`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      this.logger.error(`Job ${jobId} failed: ${failedReason}`);
    });

    this.logger.log('ReportesQueue initialized');
  }

  async onModuleDestroy() {
    await this.queueEvents.close();
    await this.queue.close();
  }

  private async getConnection() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

    return {
      host: redisHost,
      port: redisPort,
    };
  }

  async addReporteJob(data: ReporteJobData, options?: JobsOptions): Promise<string> {
    const job = await this.queue.add('generar-reporte', data, {
      jobId: data.reporteId,
      ...options,
    });

    this.logger.log(`Reporte job added: ${job.id}`);
    return job.id || data.reporteId;
  }

  async getJobStatus(jobId: string): Promise<{
    state: string;
    progress: number;
    attempts: number;
    failedReason?: string;
  }> {
    const job = await this.queue.getJob(jobId);

    if (!job) {
      return { state: 'unknown', progress: 0, attempts: 0 };
    }

    const state = await job.getState();
    const progress = job.progress as number || 0;
    const attempts = job.attemptsMade;
    const failedReason = job.failedReason;

    return { state, progress, attempts, failedReason };
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.queue.getJob(jobId);

    if (!job) {
      return false;
    }

    const state = await job.getState();
    if (state === 'completed' || state === 'failed') {
      return false;
    }

    await job.cancel();
    return true;
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }
}