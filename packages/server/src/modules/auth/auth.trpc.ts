import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { UserRole } from './dto/auth.dto';
import { RouterInputs, RouterOutputs } from '../../trpc/trpc.router';

const t = initTRPC.create();

export const authRouter = (authService: AuthService) =>
  t.router({
    login: t.procedure
      .input(
        z.object({
          email: z.string().email('Email inválido'),
          password: z.string().min(1, 'Password es requerido'),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          return await authService.login(input);
        } catch (error: any) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: error.message || 'Credenciales inválidas',
          });
        }
      }),

    register: t.procedure
      .input(
        z.object({
          email: z.string().email('Email inválido'),
          password: z.string().min(8, 'Password debe tener al menos 8 caracteres'),
          role: z.nativeEnum(UserRole),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          return await authService.register(input);
        } catch (error: any) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message || 'El email ya está registrado',
          });
        }
      }),

    registerEgresado: t.procedure
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
          return await authService.registerEgresado(input);
        } catch (error: any) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message || 'El email ya está registrado',
          });
        }
      }),

    registerEmpresa: t.procedure
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
          return await authService.registerEmpresa(input);
        } catch (error: any) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message || 'El email o NIT ya está registrado',
          });
        }
      }),

    logout: t.procedure
      .input(z.object({}))
      .mutation(async ({ ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'No autenticado',
          });
        }
        return authService.logout(userId);
      }),

    refreshToken: t.procedure
      .input(z.object({ userId: z.string() }))
      .mutation(async ({ input }) => {
        try {
          return await authService.refreshToken(input.userId);
        } catch (error: any) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: error.message || 'Token inválido',
          });
        }
      }),
  });

export type AuthRouter = ReturnType<typeof authRouter>;
