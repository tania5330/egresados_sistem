import { Injectable } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';

@Injectable()
export class TrpcService {
  public t = initTRPC.context<Context>().create();
  public publicProcedure = this.t.procedure;
  public router = this.t.router;
  public middleware = this.t.middleware;

  public protectedProcedure = this.publicProcedure.use(
    this.middleware(async ({ ctx, next }) => {
      if (!ctx.user) {
        const hasAuthHeader = !!ctx.req.headers.authorization;
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: hasAuthHeader 
            ? 'Sesión expirada o inválida. Por favor, vuelva a iniciar sesión.' 
            : 'No autenticado. Por favor, inicie sesión para continuar.',
        });
      }
      return next({
        ctx: {
          ...ctx,
          user: ctx.user,
        },
      });
    }),
  );
}
