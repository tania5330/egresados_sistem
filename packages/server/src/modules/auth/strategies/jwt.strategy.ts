import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default-secret-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      include: {
        rol: true,
      }
    });

    if (!usuario || !usuario.estado) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }

    return {
      id: usuario.id,
      email: usuario.email,
      role: usuario.rol.nombre,
    };
  }
}
