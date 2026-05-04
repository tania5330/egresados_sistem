import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReportesService } from './reportes.service';
import { ReportesTrpc } from './reportes.trpc';
import { ReportesProcessor } from './reportes.processor';
import { ReportesQueue } from './reportes.queue';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reportes',
    }),
  ],
  providers: [ReportesService, ReportesTrpc, ReportesProcessor, ReportesQueue],
  exports: [ReportesService, ReportesTrpc],
})
export class ReportesModule {}
