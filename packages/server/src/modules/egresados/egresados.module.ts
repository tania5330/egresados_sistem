import { Module } from '@nestjs/common';
import { EgresadosService } from './egresados.service';
import { EgresadosTrpc } from './egresados.trpc';

@Module({
  providers: [EgresadosService, EgresadosTrpc],
  exports: [EgresadosService, EgresadosTrpc],
})
export class EgresadosModule {}