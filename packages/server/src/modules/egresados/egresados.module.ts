import { Module } from '@nestjs/common';
import { EgresadosService } from './egresados.service';
import { EgresadosTrpc } from './egresados.trpc';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EgresadosService, EgresadosTrpc],
  exports: [EgresadosService, EgresadosTrpc],
})
export class EgresadosModule {}