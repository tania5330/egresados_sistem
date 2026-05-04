import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { UserRole } from './dto/auth.dto';
import { TrpcService } from '../../trpc/trpc.service';
import { TRPCError } from '@trpc/server';

@Injectable()
export class AuthTrpc {
  constructor(
    private trpc: TrpcService,
    private authService: AuthService,
  ) {}

  router = this.trpc.router({
    login: this.trpc.publicProcedure
      .input(
        z.object({
          email: z.string().email('Email inválido'),
          password: z.string().min(1, 'Password es requerido'),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          return await this.authService.login(input);
        } catch (error: any) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: error.message || 'Credenciales inválidas',
          });
        }
      }),

    register: this.trpc.publicProcedure
      .input(
        z.object({
          email: z.string().email('Email inválido'),
          password: z.string().min(8, 'Password debe tener al menos 8 caracteres'),
          role: z.nativeEnum(UserRole),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          return await this.authService.register(input);
        } catch (error: any) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message || 'El email ya está registrado',
          });
        }
      }),

    registerEgresado: this.trpc.publicProcedure
      .input(
        z.object({
          email: z.string().email('Email inválido'),
          password: z.string().min(8, 'Password debe tener al menos 8 caracteres'),
          nombres: z.string().min(1, 'Nombres es requerido'),
          apellidos: z.string().min(1, 'Apellidos es requerido'),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          return await this.authService.registerEgresado({
            ...input,
            role: UserRole.EGRESADO,
          });
        } catch (error: any) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message || 'El email ya está registrado',
          });
        }
      }),

    registerEmpresa: this.trpc.publicProcedure
      .input(
        z.object({
          email: z.string().email('Email inválido'),
          password: z.string().min(8, 'Password debe tener al menos 8 caracteres'),
          nombre: z.string().min(1, 'Nombre de empresa es requerido'),
          nit: z.string().min(1, 'NIT es requerido'),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          return await this.authService.registerEmpresa({
            ...input,
            role: UserRole.EMPRESA,
          });
        } catch (error: any) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message || 'El email o NIT ya está registrado',
          });
        }
      }),

    logout: this.trpc.protectedProcedure.mutation(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No autenticado',
        });
      }
      return this.authService.logout(userId);
    }),

    refreshToken: this.trpc.publicProcedure
      .input(z.object({ userId: z.string() }))
      .mutation(async ({ input }) => {
        return this.authService.refreshToken(input.userId);
      }),
  });
}
