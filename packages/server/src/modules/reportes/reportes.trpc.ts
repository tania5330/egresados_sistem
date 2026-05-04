import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '../../trpc/trpc.service';
import { ReportesService } from './reportes.service';
import { createReporteSchema } from './dto';
import { TRPCError } from '@trpc/server';

@Injectable()
export class ReportesTrpc {
  constructor(
    private trpc: TrpcService,
    private service: ReportesService,
  ) {}

  router = this.trpc.router({
    generar: this.trpc.protectedProcedure
      .input(createReporteSchema)
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'ADMIN') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acceso solo para administradores' });
        }
        return this.service.crearReporte(input, ctx.user.id);
      }),

    getMisReportes: this.trpc.protectedProcedure
      .input(z.object({
        tipo: z.string().optional(),
        estado: z.string().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        return this.service.getMisReportes(ctx.user.id, input);
      }),

    getEstado: this.trpc.protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return this.service.getEstadoReporte(input.id);
      }),

    cancelar: this.trpc.protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return this.service.cancelarReporte(input.id, ctx.user.id);
      }),
  });
}
