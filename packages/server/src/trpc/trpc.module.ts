import { Module, Global } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { AppRouter } from './trpc.router';
import { AuthModule } from '../modules/auth/auth.module';
import { DashboardModule } from '../modules/dashboard/dashboard.module';
import { EgresadosModule } from '../modules/egresados/egresados.module';
import { OfertasModule } from '../modules/ofertas/ofertas.module';
import { EmpresasModule } from '../modules/empresas/empresas.module';
import { ReportesModule } from '../modules/reportes/reportes.module';

@Global()
@Module({
  imports: [AuthModule, DashboardModule, EgresadosModule, OfertasModule, EmpresasModule, ReportesModule],
  providers: [TrpcService, AppRouter],
  exports: [TrpcService, AppRouter],
})
export class TrpcModule {}
