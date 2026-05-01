import { Module, forwardRef } from '@nestjs/common';
import { OfertasService } from './ofertas.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [forwardRef(() => PrismaModule)],
  providers: [OfertasService],
  exports: [OfertasService],
})
export class OfertasModule {}