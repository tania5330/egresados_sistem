import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { EgresadosService } from './egresados.service';
import { CreateEgresadoDto, UpdateEgresadoDto, FilterEgresadoDto, Genero, NivelHabilidad } from './dto';

const t = initTRPC.create();

export const egresadosRouter = (service: EgresadosService) =>
  t.router({
    list: t.procedure
      .input(FilterEgresadoDto)
      .query(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return service.findAll(input, ctx.user.role, ctx.user.id);
      }),

    byId: t.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return service.findOne(input.id, ctx.user.role, ctx.user.id);
      }),

    stats: t.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return service.getStats(input.id, ctx.user.role, ctx.user.id);
      }),

    globalStats: t.procedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
      }
      return service.getGlobalStats(ctx.user.role);
    }),

    create: t.procedure
      .input(CreateEgresadoDto)
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        if (ctx.user.role !== 'ADMIN') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo ADMIN puede crear egresados' });
        }
        return service.create(input, ctx.user.egresadoId || ctx.user.id);
      }),

    update: t.procedure
      .input(
        z.object({
          id: z.string(),
          data: UpdateEgresadoDto,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return service.update(input.id, input.data, ctx.user.role, ctx.user.id);
      }),

    delete: t.procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return service.remove(input.id, ctx.user.role);
      }),

    addFormacion: t.procedure
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
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return service.addFormacionAcademica(input.egresadoId, input.data, ctx.user.role, ctx.user.id);
      }),

    updateFormacion: t.procedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            institucion: z.string().min(1).optional(),
            titulo: z.string().min(1).optional(),
            carrera: z.string().optional(),
            carrera_id: z.string().uuid().optional(),
            fecha_inicio: z.date().optional(),
            fecha_fin: z.date().optional(),
            culminada: z.boolean().optional(),
          }),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return service.updateFormacionAcademica(input.id, input.data, ctx.user.role, ctx.user.id);
      }),

    deleteFormacion: t.procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return service.deleteFormacionAcademica(input.id, ctx.user.role, ctx.user.id);
      }),

    addExperiencia: t.procedure
      .input(
        z.object({
          egresadoId: z.string(),
          data: z.object({
            empresa: z.string().min(1),
            cargo: z.string().min(1),
            descripcion: z.string().optional(),
            fecha_inicio: z.date(),
            fecha_fin: z.date().optional(),
            trabajo_actual: z.boolean(),
          }),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return service.addExperienciaLaboral(input.egresadoId, input.data, ctx.user.role, ctx.user.id);
      }),

    updateExperiencia: t.procedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            empresa: z.string().min(1).optional(),
            cargo: z.string().min(1).optional(),
            descripcion: z.string().optional(),
            fecha_inicio: z.date().optional(),
            fecha_fin: z.date().optional(),
            trabajo_actual: z.boolean().optional(),
          }),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return service.updateExperienciaLaboral(input.id, input.data, ctx.user.role, ctx.user.id);
      }),

    deleteExperiencia: t.procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return service.deleteExperienciaLaboral(input.id, ctx.user.role, ctx.user.id);
      }),

    updateHabilidad: t.procedure
      .input(
        z.object({
          egresadoId: z.string(),
          habilidadId: z.string(),
          nivel: z.nativeEnum(NivelHabilidad),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return service.updateHabilidad(input.egresadoId, input.habilidadId, input.nivel, ctx.user.role, ctx.user.id);
      }),

    deleteHabilidad: t.procedure
      .input(
        z.object({
          egresadoId: z.string(),
          habilidadId: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return service.deleteHabilidad(input.egresadoId, input.habilidadId, ctx.user.role, ctx.user.id);
      }),
  });

export type EgresadosRouter = ReturnType<typeof egresadosRouter>;