import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createContext = async ({ req, res }: CreateExpressContextOptions) => {
  const getUser = async () => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (!token || token === 'null' || token === 'undefined') {
        return null;
      }

      try {
        const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
        const decoded = jwt.verify(token, secret) as any;
        
        if (!decoded || !decoded.sub) {
          return null;
        }

        const usuario = await prisma.usuario.findUnique({
          where: { id: decoded.sub },
          include: {
            rol: true,
            egresado: { select: { id: true } },
            empresa: { select: { id: true } },
          }
        });

        if (!usuario || !usuario.estado) {
          return null;
        }

        return {
          id: usuario.id,
          email: usuario.email,
          role: usuario.rol.nombre,
          egresado: usuario.egresado,
          empresa: usuario.empresa,
        };
      } catch (err) {
        return null;
      }
    }
    return null;
  };

  const user = await getUser();

  return {
    req,
    res,
    user,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
