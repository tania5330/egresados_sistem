import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { OfertasService } from './ofertas.service';
import { ModalidadOferta, TipoContrato, FilterOfertaDto } from './dto/create-oferta.dto';
import { EstadoPostulacion } from './dto/postulacion.dto';

const t = initTRPC.create();

export const ofertasRouter = (ofertasService: OfertasService) =>
  t.router({
    list: t.procedure
      .input(
        z.object({
          ciudad: z.string().optional(),
          pais: z.string().optional(),
          modalidad: z.nativeEnum(ModalidadOferta).optional(),
          tipo_contrato: z.nativeEnum(TipoContrato).optional(),
          salario_min: z.number().optional(),
          salario_max: z.number().optional(),
          habilidades: z.array(z.string()).optional(),
          fecha_cierre_desde: z.string().optional(),
          fecha_cierre_hasta: z.string().optional(),
          activa: z.boolean().optional(),
          page: z.number().optional(),
          limit: z.number().optional(),
        }),
      )
      .query(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return ofertasService.findAll(input as FilterOfertaDto);
      }),

    byId: t.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return ofertasService.findById(input.id);
      }),

    misOfertas: t.procedure
      .input(z.object({}))
      .query(async ({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return ofertasService.misOfertas(ctx.user.id);
      }),

    postulacionesRecibidas: t.procedure
      .input(z.object({}))
      .query(async ({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        if (ctx.user.role !== 'EMPRESA' && ctx.user.role !== 'ADMIN') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo empresas o admins' });
        }
        return ofertasService.postulacionesRecibidas(ctx.user.id);
      }),

    create: t.procedure
      .input(
        z.object({
          titulo: z.string().min(1, 'Título es requerido'),
          descripcion: z.string().min(1, 'Descripción es requerida'),
          requisitos: z.string().optional(),
          beneficios: z.string().optional(),
          modalidad: z.nativeEnum(ModalidadOferta),
          tipo_contrato: z.nativeEnum(TipoContrato),
          salario_min: z.number().optional(),
          salario_max: z.number().optional(),
          moneda: z.string().optional(),
          ciudad: z.string().optional(),
          pais: z.string().optional(),
          activa: z.boolean().optional(),
          plazas_disponibles: z.number().min(1),
          fecha_cierre: z.string().optional(),
          habilidades: z.array(z.object({ id: z.string(), obligatoria: z.boolean() })).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        if (ctx.user.role !== 'EMPRESA' && ctx.user.role !== 'ADMIN') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo empresas o admins' });
        }
        return ofertasService.create(input as any, ctx.user.id);
      }),

    update: t.procedure
      .input(
        z.object({
          id: z.string(),
          titulo: z.string().optional(),
          descripcion: z.string().optional(),
          requisitos: z.string().optional(),
          beneficios: z.string().optional(),
          modalidad: z.nativeEnum(ModalidadOferta).optional(),
          tipo_contrato: z.nativeEnum(TipoContrato).optional(),
          salario_min: z.number().optional(),
          salario_max: z.number().optional(),
          moneda: z.string().optional(),
          ciudad: z.string().optional(),
          pais: z.string().optional(),
          activa: z.boolean().optional(),
          plazas_disponibles: z.number().optional(),
          fecha_cierre: z.string().optional(),
          habilidades: z.array(z.object({ id: z.string(), obligatoria: z.boolean() })).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return ofertasService.update(input.id, input as any, ctx.user.id, ctx.user.role);
      }),

    delete: t.procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return ofertasService.delete(input.id, ctx.user.id, ctx.user.role);
      }),

    postulacion: t.procedure
      .input(
        z.object({
          oferta_id: z.string(),
          carta_presentacion: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        if (ctx.user.role !== 'EGRESADO' && ctx.user.role !== 'ADMIN') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo egresados' });
        }
        return ofertasService.postulacion(input.oferta_id, ctx.user.id, input.carta_presentacion);
      }),

    actualizarEstado: t.procedure
      .input(
        z.object({
          postulacion_id: z.string(),
          estado: z.enum(['POSTULADO', 'EN_REVISION', 'ENTREVISTA', 'CONTRATADO', 'RECHAZADO']),
          comentario: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
        }
        return ofertasService.actualizarEstado(
          input.postulacion_id,
          input.estado,
          ctx.user.id,
          ctx.user.role,
          input.comentario,
        );
      }),
  });

export type OfertasRouter = ReturnType<typeof ofertasRouter>;