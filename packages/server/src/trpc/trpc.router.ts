import { Injectable } from '@nestjs/common';
import { AuthTrpc } from '../modules/auth/auth.trpc';
import { DashboardTrpc } from '../modules/dashboard/dashboard.trpc';
import { EgresadosTrpc } from '../modules/egresados/egresados.trpc';
import { OfertasTrpc } from '../modules/ofertas/ofertas.trpc';
import { EmpresasTrpc } from '../modules/empresas/empresas.trpc';
import { ReportesTrpc } from '../modules/reportes/reportes.trpc';
import { TrpcService } from './trpc.service';

@Injectable()
export class AppRouter {
  constructor(
    private trpc: TrpcService,
    private authTrpc: AuthTrpc,
    private dashboardTrpc: DashboardTrpc,
    private egresadosTrpc: EgresadosTrpc,
    private ofertasTrpc: OfertasTrpc,
    private empresasTrpc: EmpresasTrpc,
    private reportesTrpc: ReportesTrpc,
  ) {}

  public appRouter = this.trpc.router({
    auth: this.authTrpc.router,
    dashboard: this.dashboardTrpc.router,
    egresados: this.egresadosTrpc.router,
    ofertas: this.ofertasTrpc.router,
    empresas: this.empresasTrpc.router,
    reportes: this.reportesTrpc.router,
  });
}

export type TAppRouter = AppRouter['appRouter'];
