import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto, RegisterEgresadoDto, RegisterEmpresaDto, UserRole } from './dto/auth.dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface UserWithProfile {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  egresado?: { id: string } | null;
  empresa?: { id: string } | null;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    return this.generateTokens(user);
  }

  async register(dto: RegisterDto): Promise<TokenPair> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash: passwordHash,
        role: dto.role as UserRole,
      },
    });

    if (dto.role === UserRole.EGRESADO) {
      throw new BadRequestException('Use el endpoint de registro para egresados');
    }

    if (dto.role === UserRole.EMPRESA) {
      throw new BadRequestException('Use el endpoint de registro para empresas');
    }

    return this.generateTokens(user);
  }

  async registerEgresado(dto: RegisterEgresadoDto): Promise<TokenPair> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash: passwordHash,
        role: UserRole.EGRESADO,
        egresado: {
          create: {
            nombres: dto.nombres,
            apellidos: dto.apellidos,
          },
        },
      },
      include: {
        egresado: true,
      },
    });

    return this.generateTokens(user);
  }

  async registerEmpresa(dto: RegisterEmpresaDto): Promise<TokenPair> {
    const existingUser = await this.prisma.user.findUnique({
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

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash: passwordHash,
        role: UserRole.EMPRESA,
        empresa: {
          create: {
            nombre: dto.nombre,
            nit: dto.nit,
          },
        },
      },
      include: {
        empresa: true,
      },
    });

    return this.generateTokens(user);
  }

  async logout(userId: string): Promise<{ message: string }> {
    return { message: 'Sesión cerrada correctamente' };
  }

  async refreshToken(userId: string): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }

    return this.generateTokens(user);
  }

  async validateToken(token: string): Promise<UserWithProfile | null> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          egresado: { select: { id: true } },
          empresa: { select: { id: true } },
        },
      });

      return user as UserWithProfile;
    } catch {
      return null;
    }
  }

  private generateTokens(user: UserWithProfile): TokenPair {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    });

    return { accessToken, refreshToken };
  }
}
