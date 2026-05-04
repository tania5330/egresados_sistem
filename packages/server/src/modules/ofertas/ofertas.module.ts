import { Module } from '@nestjs/common';
import { OfertasService } from './ofertas.service';
import { OfertasTrpc } from './ofertas.trpc';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OfertasService, OfertasTrpc],
  exports: [OfertasService, OfertasTrpc],
})
export class OfertasModule {}
