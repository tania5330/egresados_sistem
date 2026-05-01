import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { DashboardService } from './dashboard.service';
import { CacheService } from '../../../common/services/cache.service';

@Module({
  imports: [PrismaModule],
  providers: [DashboardService, CacheService],
  exports: [DashboardService],
})
export class DashboardModule {}
