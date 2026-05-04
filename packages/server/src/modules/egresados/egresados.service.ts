import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEgresadoDto, UpdateEgresadoDto, FilterEgresadoDto } from './dto';
import { Genero, NivelHabilidad } from '@prisma/client';

export interface EgresadoConRelaciones {
  id: string;
  usuario_id: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  fecha_nacimiento: Date | null;
  foto_url: string | null;
  cv_url: string | null;
  biografia: string | null;
  genero: Genero | null;
  buscando_empleo: boolean;
  creado_at: Date;
  actualizado_at: Date;
  usuario: { id: string; email: string; rol: { nombre: string } };
  formacion_academica: Array<{
    id: string;
    institucion: string;
    titulo: string;
    carrera_nombre: string | null;
    carrera_id: string | null;
    fecha_inicio: Date;
    fecha_fin: Date | null;
    culminada: boolean;
  }>;
  experiencia_laboral: Array<{
    id: string;
    empresa: string;
    cargo: string;
    descripcion: string | null;
    fecha_inicio: Date;
    fecha_fin: Date | null;
    trabajo_actual: boolean;
  }>;
  habilidades: Array<{
    id: string;
    nivel: NivelHabilidad;
    habilidad: {
      id: string;
      nombre: string;
      tipo: string;
      categoria: string | null;
    };
  }>;
}

@Injectable()
export class EgresadosService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<EgresadoConRelaciones | null> {
    return this.prisma.egresado.findUnique({
      where: { usuario_id: userId },
      include: {
        usuario: { select: { id: true, email: true, rol: { select: { nombre: true } } } },
        formacion_academica: { orderBy: { fecha_fin: 'desc' } },
        experiencia_laboral: { orderBy: { fecha_inicio: 'desc' } },
        habilidades: { include: { habilidad: true } },
      },
    }) as any;
  }

  async create(createEgresadoDto: CreateEgresadoDto, userId: string): Promise<EgresadoConRelaciones> {
    return this.prisma.egresado.create({
      data: {
        usuario_id: userId,
        nombres: createEgresadoDto.nombres,
        apellidos: createEgresadoDto.apellidos,
        telefono: createEgresadoDto.telefono,
        fecha_nacimiento: createEgresadoDto.fecha_nacimiento,
        foto_url: createEgresadoDto.foto_url,
        cv_url: createEgresadoDto.cv_url,
        biografia: createEgresadoDto.biografia,
        genero: createEgresadoDto.genero,
        buscando_empleo: createEgresadoDto.buscando_empleo,
        formacion_academica: createEgresadoDto.formacion_academica
          ? { create: createEgresadoDto.formacion_academica }
          : undefined,
        experiencia_laboral: createEgresadoDto.experiencia_laboral
          ? { create: createEgresadoDto.experiencia_laboral }
          : undefined,
        habilidades: createEgresadoDto.habilidades
          ? {
              create: createEgresadoDto.habilidades.map((h) => ({
                habilidad_id: h.habilidad_id,
                nivel: h.nivel,
              })),
            }
          : undefined,
      },
      include: {
        usuario: { select: { id: true, email: true, rol: { select: { nombre: true } } } },
        formacion_academica: true,
        experiencia_laboral: true,
        habilidades: { include: { habilidad: true } },
      },
    }) as any;
  }

  async findAll(filters: FilterEgresadoDto, userRole: string, userId: string) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.buscando_empleo !== undefined) where.buscando_empleo = filters.buscando_empleo;
    if (filters.genero) where.genero = filters.genero;
    if (filters.search) {
      where.OR = [
        { nombres: { contains: filters.search, mode: 'insensitive' } },
        { apellidos: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (userRole !== 'ADMIN') where.usuario = { estado: true };

    const [data, total] = await Promise.all([
      this.prisma.egresado.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creado_at: 'desc' },
        include: {
          usuario: { select: { id: true, email: true, rol: { select: { nombre: true } } } },
          formacion_academica: { orderBy: { fecha_fin: 'desc' } },
          experiencia_laboral: { orderBy: { fecha_inicio: 'desc' } },
          habilidades: { include: { habilidad: true } },
        },
      }),
      this.prisma.egresado.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userRole: string, userId: string): Promise<EgresadoConRelaciones> {
    const egresado = await this.prisma.egresado.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, email: true, rol: { select: { nombre: true } } } },
        formacion_academica: { orderBy: { fecha_fin: 'desc' } },
        experiencia_laboral: { orderBy: { fecha_inicio: 'desc' } },
        habilidades: { include: { habilidad: true } },
      },
    });

    if (!egresado) throw new NotFoundException('Egresado no encontrado');
    if (userRole !== 'ADMIN' && egresado.usuario_id !== userId) throw new ForbiddenException('No autorizado');

    return egresado as any;
  }

  async update(id: string, updateEgresadoDto: UpdateEgresadoDto, userRole: string, userId: string): Promise<EgresadoConRelaciones> {
    const existing = await this.prisma.egresado.findUnique({ where: { id }, include: { usuario: true } });
    if (!existing) throw new NotFoundException('Egresado no encontrado');
    if (userRole !== 'ADMIN' && existing.usuario_id !== userId) throw new ForbiddenException('No autorizado');

    const { formacion_academica, experiencia_laboral, habilidades, ...egresadoData } = updateEgresadoDto;

    return this.prisma.egresado.update({
      where: { id },
      data: {
        ...egresadoData,
        formacion_academica: formacion_academica ? {
          deleteMany: {},
          create: formacion_academica
        } : undefined,
        experiencia_laboral: experiencia_laboral ? {
          deleteMany: {},
          create: experiencia_laboral
        } : undefined,
        habilidades: habilidades ? {
          deleteMany: {},
          create: habilidades.map(h => ({
            habilidad_id: h.habilidad_id,
            nivel: h.nivel
          }))
        } : undefined,
      },
      include: {
        usuario: { select: { id: true, email: true, rol: { select: { nombre: true } } } },
        formacion_academica: true,
        experiencia_laboral: true,
        habilidades: { include: { habilidad: true } },
      },
    }) as any;
  }

  async remove(id: string, userRole: string): Promise<void> {
    if (userRole !== 'ADMIN') throw new ForbiddenException('Solo ADMIN');
    await this.prisma.egresado.delete({ where: { id } });
  }

  async getStats(egresadoId: string, userRole: string, userId: string) {
    const egresado = await this.prisma.egresado.findUnique({ where: { id: egresadoId } });
    if (!egresado) throw new NotFoundException('Egresado no encontrado');
    if (userRole !== 'ADMIN' && egresado.usuario_id !== userId) throw new ForbiddenException('No autorizado');

    const [postulaciones, entrevistas, contratados] = await Promise.all([
      this.prisma.postulacion.count({ where: { egresado_id: egresadoId } }),
      this.prisma.postulacion.count({ where: { egresado_id: egresadoId, estado: 'ENTREVISTA' } }),
      this.prisma.postulacion.count({ where: { egresado_id: egresadoId, estado: 'CONTRATADO' } }),
    ]);

    return { postulaciones, entrevistas, contratados };
  }

  async getGlobalStats(userRole: string) {
    if (userRole !== 'ADMIN') throw new ForbiddenException('Solo ADMIN');
    const [total, buscando] = await Promise.all([
      this.prisma.egresado.count(),
      this.prisma.egresado.count({ where: { buscando_empleo: true } }),
    ]);
    return { total_egresados: total, buscando_empleo: buscando };
  }

  async addFormacionAcademica(egresadoId: string, data: any, userRole: string, userId: string) {
    const egresado = await this.prisma.egresado.findUnique({ where: { id: egresadoId } });
    if (!egresado) throw new NotFoundException('Egresado no encontrado');
    if (userRole !== 'ADMIN' && egresado.usuario_id !== userId) throw new ForbiddenException('No autorizado');

    return this.prisma.formacionAcademica.create({
      data: { ...data, egresado_id: egresadoId },
    });
  }

  async addExperienciaLaboral(egresadoId: string, data: any, userRole: string, userId: string) {
    const egresado = await this.prisma.egresado.findUnique({ where: { id: egresadoId } });
    if (!egresado) throw new NotFoundException('Egresado no encontrado');
    if (userRole !== 'ADMIN' && egresado.usuario_id !== userId) throw new ForbiddenException('No autorizado');

    return this.prisma.experienciaLaboral.create({
      data: { ...data, egresado_id: egresadoId },
    });
  }

  async addSkill(egresadoId: string, data: any, userRole: string, userId: string) {
    const egresado = await this.prisma.egresado.findUnique({ where: { id: egresadoId } });
    if (!egresado) throw new NotFoundException('Egresado no encontrado');
    if (userRole !== 'ADMIN' && egresado.usuario_id !== userId) throw new ForbiddenException('No autorizado');

    return this.prisma.egresadoHabilidad.create({
      data: { ...data, egresado_id: egresadoId },
    });
  }
}
