import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { DashboardService } from './dashboard.service';
import { UserRole } from '../auth/dto/auth.dto';
import { AdminDashboardFiltersDto, EmpresaDashboardFiltersDto, EgresadoDashboardFiltersDto } from './dto/dashboard-filters.dto';

const t = initTRPC.create();

export const dashboardRouter = (dashboardService: DashboardService) =>
  t.router({
    getAdminDashboard: t.procedure
      .input(
        z.object({
          fechaInicio: z.string().optional(),
          fechaFin: z.string().optional(),
          carreraId: z.string().uuid().optional(),
          facultadId: z.string().uuid().optional(),
          sector: z.string().optional(),
          ciudad: z.string().optional(),
          pais: z.string().optional(),
          anioEgreso: z.number().int().min(2020).max(2030).optional(),
          limite: z.number().int().min(1).max(100).optional(),
          topHabilidades: z.number().int().min(1).max(100).optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.user || ctx.user.role !== UserRole.ADMIN) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acceso solo para administradores',
          });
        }

        const filters: AdminDashboardFiltersDto = {
          fechaInicio: input.fechaInicio,
          fechaFin: input.fechaFin,
          carreraId: input.carreraId,
          facultadId: input.facultadId,
          sector: input.sector,
          ciudad: input.ciudad,
          pais: input.pais,
          anioEgreso: input.anioEgreso,
          limite: input.limite,
          topHabilidades: input.topHabilidades,
        };

        try {
          return await dashboardService.getAdminDashboard(filters);
        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Error al obtener dashboard de administración',
          });
        }
      }),

    getEmpresaDashboard: t.procedure
      .input(
        z.object({
          fechaInicio: z.string().optional(),
          fechaFin: z.string().optional(),
          ofertaId: z.string().uuid().optional(),
          limite: z.number().int().min(1).max(100).optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'No autenticado',
          });
        }

        if (ctx.user.role !== UserRole.EMPRESA) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acceso solo para empresas',
          });
        }

        const empresaId = ctx.user.empresa?.id;
        if (!empresaId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Perfil de empresa no encontrado',
          });
        }

        const filters: EmpresaDashboardFiltersDto = {
          fechaInicio: input.fechaInicio,
          fechaFin: input.fechaFin,
          ofertaId: input.ofertaId,
          limite: input.limite,
        };

        try {
          return await dashboardService.getEmpresaDashboard(empresaId, filters);
        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Error al obtener dashboard de empresa',
          });
        }
      }),

    getEgresadoDashboard: t.procedure
      .input(
        z.object({
          fechaInicio: z.string().optional(),
          fechaFin: z.string().optional(),
          limiteOfertas: z.number().int().min(1).max(100).optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'No autenticado',
          });
        }

        if (ctx.user.role !== UserRole.EGRESADO) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acceso solo para egresados',
          });
        }

        const egresadoId = ctx.user.egresado?.id;
        if (!egresadoId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Perfil de egresado no encontrado',
          });
        }

        const filters: EgresadoDashboardFiltersDto = {
          fechaInicio: input.fechaInicio,
          fechaFin: input.fechaFin,
          limiteOfertas: input.limiteOfertas,
        };

        try {
          return await dashboardService.getEgresadoDashboard(egresadoId, filters);
        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Error al obtener dashboard de egresado',
          });
        }
      }),

    invalidateCache: t.procedure
      .input(
        z.object({
          pattern: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || ctx.user.role !== UserRole.ADMIN) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acceso solo para administradores',
          });
        }

        try {
          await dashboardService.invalidateCache(input.pattern);
          return { success: true, message: 'Caché invalidado correctamente' };
        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Error al invalidar caché',
          });
        }
      }),
  });

export type DashboardRouter = ReturnType<typeof dashboardRouter>;
