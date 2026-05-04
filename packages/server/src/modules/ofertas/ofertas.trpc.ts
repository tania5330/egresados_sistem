import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { OfertasService } from './ofertas.service';
import { CreateOfertaSchema, UpdateOfertaSchema, FilterOfertaSchema } from './dto/oferta.schema';
import { TrpcService } from '../../trpc/trpc.service';

@Injectable()
export class OfertasTrpc {
  constructor(
    private trpc: TrpcService,
    private service: OfertasService,
  ) {}

  router = this.trpc.router({
    list: this.trpc.protectedProcedure
      .input(FilterOfertaSchema)
      .query(async ({ input, ctx }) => {
        return this.service.findAll(input as any, ctx.user?.role);
      }),

    byId: this.trpc.protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return this.service.findById(input.id);
      }),

    misOfertas: this.trpc.protectedProcedure
      .input(z.object({}))
      .query(async ({ ctx }) => {
        return this.service.misOfertas(ctx.user.id);
      }),

    postulacionesRecibidas: this.trpc.protectedProcedure
      .input(z.object({}))
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'EMPRESA' && ctx.user.role !== 'ADMIN') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo empresas o admins' });
        }
        return this.service.postulacionesRecibidas(ctx.user.id, ctx.user.role);
      }),

    misPostulaciones: this.trpc.protectedProcedure
      .input(z.object({}))
      .query(async ({ ctx }) => {
        return this.service.misPostulaciones(ctx.user.id, ctx.user.role);
      }),

    create: this.trpc.protectedProcedure
      .input(CreateOfertaSchema)
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'EMPRESA' && ctx.user.role !== 'ADMIN') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo empresas o admins' });
        }
        return this.service.create(input as any, ctx.user.id);
      }),

    update: this.trpc.protectedProcedure
      .input(
        z.object({
          id: z.string(),
          data: UpdateOfertaSchema,
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'EMPRESA' && ctx.user.role !== 'ADMIN') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo empresas o admins' });
        }
        return this.service.update(input.id, input.data as any, ctx.user.id, ctx.user.role);
      }),

    delete: this.trpc.protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'EMPRESA' && ctx.user.role !== 'ADMIN') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo empresas o admins' });
        }
        return this.service.delete(input.id, ctx.user.id, ctx.user.role);
      }),

    postular: this.trpc.protectedProcedure
      .input(z.object({ 
        ofertaId: z.string(), 
        cartaPresentacion: z.string().optional() 
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'EGRESADO') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo egresados pueden postular' });
        }
        return this.service.postulacion(input.ofertaId, ctx.user.id, input.cartaPresentacion);
      }),

    actualizarEstadoPostulacion: this.trpc.protectedProcedure
      .input(z.object({
        postulacionId: z.string(),
        estado: z.string(),
        comentario: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return this.service.actualizarEstado(
          input.postulacionId, 
          input.estado, 
          ctx.user.id, 
          ctx.user.role, 
          input.comentario
        );
      }),
  });
}
