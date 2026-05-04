import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { EmpresasService } from './empresas.service';
import { TrpcService } from '../../trpc/trpc.service';

@Injectable()
export class EmpresasTrpc {
  constructor(
    private trpc: TrpcService,
    private service: EmpresasService,
  ) {}

  router = this.trpc.router({
    me: this.trpc.protectedProcedure.query(async ({ ctx }) => {
      const empresa = await this.service.findByUserId(ctx.user.id);
      if (!empresa) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Perfil de empresa no encontrado' });
      }
      return empresa;
    }),

    list: this.trpc.protectedProcedure
      .input(
        z.object({
          search: z.string().optional(),
        }),
      )
      .query(async ({ input }) => {
        return this.service.findAll(input);
      }),

    byId: this.trpc.protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return this.service.findById(input.id);
      }),
  });
}
