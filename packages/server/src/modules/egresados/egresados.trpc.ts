import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { EgresadosService } from './egresados.service';
import { CreateEgresadoSchema, UpdateEgresadoSchema, FilterEgresadoSchema } from './dto/egresado.schema';
import { TrpcService } from '../../trpc/trpc.service';

@Injectable()
export class EgresadosTrpc {
  constructor(
    private trpc: TrpcService,
    private service: EgresadosService,
  ) {}

  router = this.trpc.router({
    me: this.trpc.protectedProcedure.query(async ({ ctx }) => {
      const egresado = await this.service.findByUserId(ctx.user.id);
      if (!egresado) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Perfil de egresado no encontrado' });
      }
      return egresado;
    }),

    list: this.trpc.protectedProcedure
      .input(FilterEgresadoSchema)
      .query(async ({ ctx, input }) => {
        return this.service.findAll(input as any, ctx.user.role, ctx.user.id);
      }),

    byId: this.trpc.protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        return this.service.findOne(input.id, ctx.user.role, ctx.user.id);
      }),

    stats: this.trpc.protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        return this.service.getStats(input.id, ctx.user.role, ctx.user.id);
      }),

    globalStats: this.trpc.protectedProcedure.query(async ({ ctx }) => {
      return this.service.getGlobalStats(ctx.user.role);
    }),

    create: this.trpc.protectedProcedure
      .input(CreateEgresadoSchema)
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'ADMIN') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo ADMIN puede crear egresados' });
        }
        return this.service.create(input as any, ctx.user.egresado?.id || ctx.user.id);
      }),

    update: this.trpc.protectedProcedure
      .input(
        z.object({
          id: z.string(),
          data: UpdateEgresadoSchema,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return this.service.update(input.id, input.data as any, ctx.user.role, ctx.user.id);
      }),

    delete: this.trpc.protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return this.service.remove(input.id, ctx.user.role);
      }),

    addFormacion: this.trpc.protectedProcedure
      .input(
        z.object({
          egresadoId: z.string(),
          data: z.object({
            institucion: z.string().min(1),
            titulo: z.string().min(1),
            carrera: z.string().optional(),
            carrera_id: z.string().uuid().optional(),
            fecha_inicio: z.date(),
            fecha_fin: z.date().optional(),
            culminada: z.boolean(),
          }),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return this.service.addFormacionAcademica(input.egresadoId, input.data, ctx.user.role, ctx.user.id);
      }),
  });
}
