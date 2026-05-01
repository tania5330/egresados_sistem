import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEgresadoDto, UpdateEgresadoDto, FilterEgresadoDto, Genero, NivelHabilidad } from './dto';

interface EgresadoWithRelations {
  id: string;
  user_id: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  fecha_nacimiento: Date | null;
  foto_url: string | null;
  cv_url: string | null;
  biografia: string | null;
  genero: Genero | null;
  buscando_empleo: boolean;
  created_at: Date;
  updated_at: Date;
  user: { id: string; email: string; role: string };
  formacion_academica: Array<{
    id: string;
    institucion: string;
    titulo: string;
    carrera: string | null;
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

interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class EgresadosService {
  constructor(private prisma: PrismaService) {}

  async create(createEgresadoDto: CreateEgresadoDto, userId: string): Promise<EgresadoWithRelations> {
    return this.prisma.egresado.create({
      data: {
        user_id: userId,
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
          ? {
              create: createEgresadoDto.formacion_academica,
            }
          : undefined,
        experiencia_laboral: createEgresadoDto.experiencia_laboral
          ? {
              create: createEgresadoDto.experiencia_laboral,
            }
          : undefined,
        egresado_habilidad: createEgresadoDto.habilidades
          ? {
              create: createEgresadoDto.habilidades.map((h) => ({
                habilidad_id: h.habilidad_id,
                nivel: h.nivel,
              })),
            }
          : undefined,
      },
      include: {
        user: { select: { id: true, email: true, role: true } },
        formacion_academica: true,
        experiencia_laboral: true,
        habilidades: {
          include: {
            habilidad: true,
          },
        },
      },
    });
  }

  async findAll(
    filters: FilterEgresadoDto,
    userRole: string,
    userId: string,
  ): Promise<PaginationResult<EgresadoWithRelations>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.buscando_empleo !== undefined) {
      where.buscando_empleo = filters.buscando_empleo;
    }

    if (filters.genero) {
      where.genero = filters.genero;
    }

    if (filters.search) {
      where.OR = [
        { nombres: { contains: filters.search, mode: 'insensitive' } },
        { apellidos: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.anio_egreso) {
      where.formacion_academica = {
        some: {
          culminada: true,
          fecha_fin: {
            gte: new Date(filters.anio_egreso, 0, 1),
            lte: new Date(filters.anio_egreso, 11, 31),
          },
        },
      };
    }

    if (filters.carrera_id) {
      where.formacion_academica = {
        ...where.formacion_academica,
        some: {
          ...(where.formacion_academica?.some || {}),
          carrera_id: filters.carrera_id,
        },
      };
    }

    if (filters.habilidad_ids && filters.habilidad_ids.length > 0) {
      where.egresado_habilidad = {
        some: {
          habilidad_id: { in: filters.habilidad_ids },
        },
      };
    }

    if (userRole !== 'ADMIN') {
      where.user = { is_active: true };
    }

    const [data, total] = await Promise.all([
      this.prisma.egresado.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { id: true, email: true, role: true } },
          formacion_academica: {
            orderBy: { fecha_fin: 'desc' },
          },
          experiencia_laboral: {
            orderBy: { fecha_inicio: 'desc' },
          },
          habilidades: {
            include: {
              habilidad: true,
            },
          },
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

  async findOne(id: string, userRole: string, userId: string): Promise<EgresadoWithRelations> {
    const egresado = await this.prisma.egresado.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true } },
        formacion_academica: {
          orderBy: { fecha_fin: 'desc' },
        },
        experiencia_laboral: {
          orderBy: { fecha_inicio: 'desc' },
        },
        habilidades: {
          include: {
            habilidad: true,
          },
        },
      },
    });

    if (!egresado) {
      throw new NotFoundException('Egresado no encontrado');
    }

    if (userRole !== 'ADMIN' && egresado.user_id !== userId) {
      throw new ForbiddenException('No tienes permiso para ver este perfil');
    }

    return egresado;
  }

  async update(
    id: string,
    updateEgresadoDto: UpdateEgresadoDto,
    userRole: string,
    userId: string,
  ): Promise<EgresadoWithRelations> {
    const existing = await this.prisma.egresado.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      throw new NotFoundException('Egresado no encontrado');
    }

    if (userRole !== 'ADMIN' && existing.user_id !== userId) {
      throw new ForbiddenException('No tienes permiso para actualizar este perfil');
    }

    const { formacion_academica, experiencia_laboral, habilidades, ...egresadoData } = updateEgresadoDto;

    const updateData: any = { ...egresadoData };

    if (formacion_academica !== undefined) {
      await this.prisma.formacionAcademica.deleteMany({ where: { egresado_id: id } });
      if (formacion_academica.length > 0) {
        await this.prisma.formacionAcademica.createMany({
          data: formacion_academica.map((f) => ({ ...f, egresado_id: id })),
        });
      }
    }

    if (experiencia_laboral !== undefined) {
      await this.prisma.experienciaLaboral.deleteMany({ where: { egresado_id: id } });
      if (experiencia_laboral.length > 0) {
        await this.prisma.experienciaLaboral.createMany({
          data: experiencia_laboral.map((e) => ({ ...e, egresado_id: id })),
        });
      }
    }

    if (habilidades !== undefined) {
      await this.prisma.egresadoHabilidad.deleteMany({ where: { egresado_id: id } });
      if (habilidades.length > 0) {
        await this.prisma.egresadoHabilidad.createMany({
          data: habilidades.map((h) => ({
            egresado_id: id,
            habilidad_id: h.habilidad_id,
            nivel: h.nivel,
          })),
        });
      }
    }

    return this.prisma.egresado.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, email: true, role: true } },
        formacion_academica: true,
        experiencia_laboral: true,
        habilidades: {
          include: { habilidad: true },
        },
      },
    });
  }

  async remove(id: string, userRole: string): Promise<void> {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Solo ADMIN puede eliminar egresados');
    }

    const existing = await this.prisma.egresado.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Egresado no encontrado');
    }

    await this.prisma.egresado.delete({ where: { id } });
  }

  async getStats(egresadoId: string, userRole: string, userId: string): Promise<any> {
    const egresado = await this.prisma.egresado.findUnique({
      where: { id: egresadoId },
      include: { user: true },
    });

    if (!egresado) {
      throw new NotFoundException('Egresado no encontrado');
    }

    if (userRole !== 'ADMIN' && egresado.user_id !== userId) {
      throw new ForbiddenException('No tienes permiso para ver estas estadísticas');
    }

    const [postulaciones, entrevistas, contratados] = await Promise.all([
      this.prisma.postulacion.count({ where: { egresado_id: egresadoId } }),
      this.prisma.postulacion.count({
        where: { egresado_id: egresadoId, estado: 'ENTREVISTA' },
      }),
      this.prisma.postulacion.count({
        where: { egresado_id: egresadoId, estado: 'CONTRATADO' },
      }),
    ]);

    const experiencias = await this.prisma.experienciaLaboral.count({
      where: { egresado_id: egresadoId },
    });

    const formacion = await this.prisma.formacionAcademica.count({
      where: { egresado_id: egresadoId, culminada: true },
    });

    const ofertasVistas = await this.prisma.ofertaHabilidad.count({
      where: {
        habilidad: {
          egresado_habilidad: {
            some: { egresado_id: egresadoId },
          },
        },
      },
    });

    return {
      postulaciones,
      entrevistas,
      contratados,
      experiencias_laborales: experiencias,
      formacion_academica_completada: formacion,
      habilidades_count: await this.prisma.egresadoHabilidad.count({ where: { egresado_id: egresadoId } }),
      tasa_exito: postulaciones > 0 ? ((contratados / postulaciones) * 100).toFixed(2) : 0,
    };
  }

  async getGlobalStats(userRole: string): Promise<any> {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Solo ADMIN puede ver estadísticas globales');
    }

    const [
      totalEgresados,
      buscandoEmpleo,
      conCV,
      activos,
    ] = await Promise.all([
      this.prisma.egresado.count(),
      this.prisma.egresado.count({ where: { buscando_empleo: true } }),
      this.prisma.egresado.count({ where: { NOT: { cv_url: null } } }),
      this.prisma.user.count({ where: { role: 'EGRESADO', is_active: true } }),
    ]);

    const carreras = await this.prisma.carrera.findMany({
      include: {
        _count: {
          select: { formacion_academica: true },
        },
      },
    });

    const topHabilidades = await this.prisma.habilidad.findMany({
      include: {
        _count: {
          select: { oferta_habilidad: true },
        },
      },
      orderBy: {
        oferta_habilidad: { _count: 'desc' },
      },
      take: 10,
    });

    return {
      total_egresados: totalEgresados,
      buscando_empleo: buscandoEmpleo,
      con_cv: conCV,
      usuarios_activos: activos,
      porc_buscando_empleo: totalEgresados > 0 ? ((buscandoEmpleo / totalEgresados) * 100).toFixed(2) : 0,
      distribucion_carreras: carreras.map((c) => ({ id: c.id, nombre: c.nombre, count: c._count.formacion_academica })),
      top_habilidades: topHabilidades.map((h) => ({ id: h.id, nombre: h.nombre, tipo: h.tipo, ofertas_count: h._count.oferta_habilidad })),
    };
  }

  async addFormacionAcademica(
    egresadoId: string,
    data: { institucion: string; titulo: string; carrera?: string; carrera_id?: string; fecha_inicio: Date; fecha_fin?: Date; culminada: boolean },
    userRole: string,
    userId: string,
  ) {
    const egresado = await this.prisma.egresado.findUnique({ where: { id: egresadoId }, include: { user: true } });
    if (!egresado) throw new NotFoundException('Egresado no encontrado');
    if (userRole !== 'ADMIN' && egresado.user_id !== userId) {
      throw new ForbiddenException('No tienes permiso');
    }

    return this.prisma.formacionAcademica.create({
      data: { ...data, egresado_id: egresadoId },
    });
  }

  async updateFormacionAcademica(
    formacionId: string,
    data: Partial<{ institucion: string; titulo: string; carrera?: string; carrera_id?: string; fecha_inicio: Date; fecha_fin?: Date; culminada: boolean }>,
    userRole: string,
    userId: string,
  ) {
    const existing = await this.prisma.formacionAcademica.findUnique({
      where: { id: formacionId },
      include: { egresado: { include: { user: true } } },
    });
    if (!existing) throw new NotFoundException('Formación no encontrada');
    if (userRole !== 'ADMIN' && existing.egresado.user_id !== userId) {
      throw new ForbiddenException('No tienes permiso');
    }

    return this.prisma.formacionAcademica.update({ where: { id: formacionId }, data });
  }

  async deleteFormacionAcademica(formacionId: string, userRole: string, userId: string) {
    const existing = await this.prisma.formacionAcademica.findUnique({
      where: { id: formacionId },
      include: { egresado: { include: { user: true } } },
    });
    if (!existing) throw new NotFoundException('Formación no encontrada');
    if (userRole !== 'ADMIN' && existing.egresado.user_id !== userId) {
      throw new ForbiddenException('No tienes permiso');
    }

    await this.prisma.formacionAcademica.delete({ where: { id: formacionId } });
  }

  async addExperienciaLaboral(
    egresadoId: string,
    data: { empresa: string; cargo: string; descripcion?: string; fecha_inicio: Date; fecha_fin?: Date; trabajo_actual: boolean },
    userRole: string,
    userId: string,
  ) {
    const egresado = await this.prisma.egresado.findUnique({ where: { id: egresadoId }, include: { user: true } });
    if (!egresado) throw new NotFoundException('Egresado no encontrado');
    if (userRole !== 'ADMIN' && egresado.user_id !== userId) {
      throw new ForbiddenException('No tienes permiso');
    }

    return this.prisma.experienciaLaboral.create({
      data: { ...data, egresado_id: egresadoId },
    });
  }

  async updateExperienciaLaboral(
    experienciaId: string,
    data: Partial<{ empresa: string; cargo: string; descripcion?: string; fecha_inicio: Date; fecha_fin?: Date; trabajo_actual: boolean }>,
    userRole: string,
    userId: string,
  ) {
    const existing = await this.prisma.experienciaLaboral.findUnique({
      where: { id: experienciaId },
      include: { egresado: { include: { user: true } } },
    });
    if (!existing) throw new NotFoundException('Experiencia no encontrada');
    if (userRole !== 'ADMIN' && existing.egresado.user_id !== userId) {
      throw new ForbiddenException('No tienes permiso');
    }

    return this.prisma.experienciaLaboral.update({ where: { id: experienciaId }, data });
  }

  async deleteExperienciaLaboral(experienciaId: string, userRole: string, userId: string) {
    const existing = await this.prisma.experienciaLaboral.findUnique({
      where: { id: experienciaId },
      include: { egresado: { include: { user: true } } },
    });
    if (!existing) throw new NotFoundException('Experiencia no encontrada');
    if (userRole !== 'ADMIN' && existing.egresado.user_id !== userId) {
      throw new ForbiddenException('No tienes permiso');
    }

    await this.prisma.experienciaLaboral.delete({ where: { id: experienciaId } });
  }

  async updateHabilidad(
    egresadoId: string,
    habilidadId: string,
    nivel: NivelHabilidad,
    userRole: string,
    userId: string,
  ) {
    const egresado = await this.prisma.egresado.findUnique({ where: { id: egresadoId }, include: { user: true } });
    if (!egresado) throw new NotFoundException('Egresado no encontrado');
    if (userRole !== 'ADMIN' && egresado.user_id !== userId) {
      throw new ForbiddenException('No tienes permiso');
    }

    const existing = await this.prisma.egresadoHabilidad.findUnique({
      where: { egresado_id_habilidad_id: { egresado_id: egresadoId, habilidad_id: habilidadId } },
    });

    if (existing) {
      return this.prisma.egresadoHabilidad.update({
        where: { id: existing.id },
        data: { nivel },
        include: { habilidad: true },
      });
    }

    return this.prisma.egresadoHabilidad.create({
      data: { egresado_id: egresadoId, habilidad_id: habilidadId, nivel },
      include: { habilidad: true },
    });
  }

  async deleteHabilidad(egresadoId: string, habilidadId: string, userRole: string, userId: string) {
    const egresado = await this.prisma.egresado.findUnique({ where: { id: egresadoId }, include: { user: true } });
    if (!egresado) throw new NotFoundException('Egresado no encontrado');
    if (userRole !== 'ADMIN' && egresado.user_id !== userId) {
      throw new ForbiddenException('No tienes permiso');
    }

    await this.prisma.egresadoHabilidad.delete({
      where: { egresado_id_habilidad_id: { egresado_id: egresadoId, habilidad_id: habilidadId } },
    });
  }
}