import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { TrpcModule } from './trpc/trpc.module';
import { AuthModule } from './modules/auth/auth.module';
import { EgresadosModule } from './modules/egresados/egresados.module';
import { OfertasModule } from './modules/ofertas/ofertas.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { CacheService } from './common/services/cache.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST') || 'localhost',
          port: config.get('REDIS_PORT') || 6379,
        },
      }),
    }),
    PrismaModule,
    TrpcModule,
    AuthModule,
    EgresadosModule,
    OfertasModule,
    DashboardModule,
    EmpresasModule,
    ReportesModule,
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class AppModule {}
