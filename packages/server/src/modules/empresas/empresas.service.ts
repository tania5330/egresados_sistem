import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: { search?: string }) {
    const where = filters.search
      ? {
          OR: [
            { nombre: { contains: filters.search, mode: 'insensitive' as const } },
            { nit: { contains: filters.search, mode: 'insensitive' as const } },
            { sector: { contains: filters.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.empresa.findMany({
        where,
        include: {
          usuario: {
            select: {
              email: true,
              estado: true,
            },
          },
          _count: {
            select: {
              ofertas_laborales: true,
            },
          },
        },
      }),
      this.prisma.empresa.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
      },
    };
  }

  async findByUserId(userId: string) {
    return this.prisma.empresa.findUnique({
      where: { usuario_id: userId },
      include: {
        usuario: {
          select: {
            email: true,
            rol: { select: { nombre: true } },
          },
        },
        ofertas_laborales: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.empresa.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            email: true,
            rol: { select: { nombre: true } },
          },
        },
        ofertas_laborales: true,
      },
    });
  }
}
