import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardTrpc } from './dashboard.trpc';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheService } from '../../common/services/cache.service';

@Module({
  imports: [PrismaModule],
  providers: [DashboardService, DashboardTrpc, CacheService],
  exports: [DashboardService, DashboardTrpc],
})
export class DashboardModule {}
