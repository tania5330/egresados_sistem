import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto, RegisterEgresadoDto, RegisterEmpresaDto } from './dto/auth.dto';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    profileId?: string;
  };
}

export interface UsuarioConPerfil {
  id: string;
  email: string;
  rol: { nombre: string };
  estado: boolean;
  creado_at: Date;
  egresado?: { id: string } | null;
  empresa?: { id: string } | null;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      include: {
        rol: true,
        egresado: { select: { id: true } },
        empresa: { select: { id: true } },
      }
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.estado) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, usuario.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimo_login: new Date() },
    });

    return this.generateAuthResponse(usuario as any);
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const rol = await this.prisma.rol.findUnique({
      where: { nombre: dto.role },
    });

    if (!rol) {
      throw new BadRequestException('Rol no válido');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        password_hash: passwordHash,
        rol_id: rol.id,
      },
      include: {
        rol: true,
      }
    });

    return this.generateAuthResponse(usuario as any);
  }

  async registerEgresado(dto: RegisterEgresadoDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const rol = await this.prisma.rol.findUnique({
      where: { nombre: 'EGRESADO' },
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        password_hash: passwordHash,
        rol_id: rol!.id,
        egresado: {
          create: {
            nombres: dto.nombres,
            apellidos: dto.apellidos,
          },
        },
      },
      include: {
        rol: true,
        egresado: { select: { id: true } },
      },
    });

    return this.generateAuthResponse(usuario as any);
  }

  async registerEmpresa(dto: RegisterEmpresaDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const existingNit = await this.prisma.empresa.findUnique({
      where: { nit: dto.nit },
    });

    if (existingNit) {
      throw new ConflictException('El NIT ya está registrado');
    }

    const rol = await this.prisma.rol.findUnique({
      where: { nombre: 'EMPRESA' },
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        password_hash: passwordHash,
        rol_id: rol!.id,
        empresa: {
          create: {
            nombre: dto.nombre,
            nit: dto.nit,
          },
        },
      },
      include: {
        rol: true,
        empresa: { select: { id: true } },
      },
    });

    return this.generateAuthResponse(usuario as any);
  }

  async logout(userId: string): Promise<{ message: string }> {
    return { message: 'Sesión cerrada correctamente' };
  }

  async refreshToken(userId: string): Promise<AuthResponse> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        rol: true,
        egresado: { select: { id: true } },
        empresa: { select: { id: true } },
      }
    });

    if (!usuario || !usuario.estado) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }

    return this.generateAuthResponse(usuario as any);
  }

  async validateToken(token: string): Promise<UsuarioConPerfil | null> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
      });

      const usuario = await this.prisma.usuario.findUnique({
        where: { id: payload.sub },
        include: {
          rol: true,
          egresado: { select: { id: true } },
          empresa: { select: { id: true } },
        },
      });

      return usuario as any;
    } catch {
      return null;
    }
  }

  private generateAuthResponse(usuario: UsuarioConPerfil): AuthResponse {
    const profileId = usuario.rol.nombre === 'EGRESADO' ? usuario.egresado?.id : usuario.rol.nombre === 'EMPRESA' ? usuario.empresa?.id : undefined;
    
    const payload = { 
      sub: usuario.id, 
      email: usuario.email, 
      role: usuario.rol.nombre,
      profileId 
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRES as any) || '24h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES as any) || '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: usuario.id,
        email: usuario.email,
        role: usuario.rol.nombre,
        profileId,
      },
    };
  }
}
