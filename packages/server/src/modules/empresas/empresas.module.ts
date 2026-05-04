import { Module } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { EmpresasTrpc } from './empresas.trpc';

@Module({
  providers: [EmpresasService, EmpresasTrpc],
  exports: [EmpresasService, EmpresasTrpc],
})
export class EmpresasModule {}
