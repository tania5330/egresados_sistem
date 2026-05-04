import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { DashboardService } from './dashboard.service';
import { UserRole } from '../auth/dto/auth.dto';
import { AdminDashboardFiltersDto, EmpresaDashboardFiltersDto, EgresadoDashboardFiltersDto } from './dto/dashboard-filters.dto';
import { TrpcService } from '../../trpc/trpc.service';

@Injectable()
export class DashboardTrpc {
  constructor(
    private trpc: TrpcService,
    private dashboardService: DashboardService,
  ) {}

  router = this.trpc.router({
    getAdminDashboard: this.trpc.protectedProcedure
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
        if (ctx.user.role !== UserRole.ADMIN) {
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
          return await this.dashboardService.getAdminDashboard(filters);
        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Error al obtener dashboard de administración',
          });
        }
      }),

    getEmpresaDashboard: this.trpc.protectedProcedure
      .input(
        z.object({
          fechaInicio: z.string().optional(),
          fechaFin: z.string().optional(),
          ofertaId: z.string().uuid().optional(),
          limite: z.number().int().min(1).max(100).optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        // Permitir si es ADMIN o si es EMPRESA con perfil vinculado
        const empresaId = ctx.user.empresa?.id;
        
        if (ctx.user.role !== UserRole.ADMIN && !empresaId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No se encontró perfil de empresa vinculado a este usuario',
          });
        }

        const filters: EmpresaDashboardFiltersDto = {
          fechaInicio: input.fechaInicio,
          fechaFin: input.fechaFin,
          ofertaId: input.ofertaId,
          limite: input.limite,
        };

        try {
          if (!empresaId) return null;
          return await this.dashboardService.getEmpresaDashboard(empresaId, filters);
        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Error al obtener dashboard de empresa',
          });
        }
      }),

    getEgresadoDashboard: this.trpc.protectedProcedure
      .input(
        z.object({
          fechaInicio: z.string().optional(),
          fechaFin: z.string().optional(),
          limiteOfertas: z.number().int().min(1).max(100).optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const egresadoId = ctx.user.egresado?.id;

        if (ctx.user.role !== UserRole.ADMIN && !egresadoId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No se encontró perfil de egresado vinculado a este usuario',
          });
        }

        const filters: EgresadoDashboardFiltersDto = {
          fechaInicio: input.fechaInicio,
          fechaFin: input.fechaFin,
          limiteOfertas: input.limiteOfertas,
        };

        try {
          if (!egresadoId) return null;
          return await this.dashboardService.getEgresadoDashboard(egresadoId, filters);
        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Error al obtener dashboard de egresado',
          });
        }
      }),
  });
}
