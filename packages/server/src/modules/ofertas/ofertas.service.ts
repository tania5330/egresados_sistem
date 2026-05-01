import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOfertaDto, UpdateOfertaDto, FilterOfertaDto, ModalidadOferta, TipoContrato } from './dto/create-oferta.dto';
import { EstadoPostulacion } from './dto/postulacion.dto';

@Injectable()
export class OfertasService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOfertaDto, userId: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { user_id: userId },
    });

    if (!empresa) {
      throw new ForbiddenException('Solo las empresas pueden crear ofertas');
    }

    const habilidadesData = dto.habilidades?.map(h => ({
      habilidad_id: h.id,
      obligatoria: h.obligatoria,
    })) || [];

    return this.prisma.ofertaLaboral.create({
      data: {
        empresa_id: empresa.id,
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        requisitos: dto.requisitos,
        beneficios: dto.beneficios,
        modalidad: dto.modalidad as ModalidadOferta,
        tipo_contrato: dto.tipo_contrato as TipoContrato,
        salario_min: dto.salario_min,
        salario_max: dto.salario_max,
        moneda: dto.moneda || 'COP',
        ciudad: dto.ciudad,
        pais: dto.pais || 'Colombia',
        activa: dto.activa ?? true,
        plazas_disponibles: dto.plazas_disponibles,
        fecha_cierre: dto.fecha_cierre ? new Date(dto.fecha_cierre) : null,
        oferta_habilidad: {
          create: habilidadesData,
        },
      },
      include: {
        empresa: true,
        oferta_habilidad: {
          include: {
            habilidad: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateOfertaDto, userId: string, userRole: string) {
    const oferta = await this.prisma.ofertaLaboral.findUnique({
      where: { id },
      include: { empresa: true },
    });

    if (!oferta) {
      throw new NotFoundException('Oferta no encontrada');
    }

    if (userRole !== 'ADMIN' && oferta.empresa.user_id !== userId) {
      throw new ForbiddenException('No tiene permisos para editar esta oferta');
    }

    const habilidadesData = dto.habilidades?.map(h => ({
      habilidad_id: h.id,
      obligatoria: h.obligatoria,
    }));

    return this.prisma.$transaction(async (tx) => {
      if (habilidadesData) {
        await tx.ofertaHabilidad.deleteMany({
          where: { oferta_id: id },
        });
      }

      return tx.ofertaLaboral.update({
        where: { id },
        data: {
          titulo: dto.titulo,
          descripcion: dto.descripcion,
          requisitos: dto.requisitos,
          beneficios: dto.beneficios,
          modalidad: dto.modalidad as ModalidadOferta,
          tipo_contrato: dto.tipo_contrato as TipoContrato,
          salario_min: dto.salario_min,
          salario_max: dto.salario_max,
          moneda: dto.moneda,
          ciudad: dto.ciudad,
          pais: dto.pais,
          activa: dto.activa,
          plazas_disponibles: dto.plazas_disponibles,
          fecha_cierre: dto.fecha_cierre ? new Date(dto.fecha_cierre) : null,
          oferta_habilidad: habilidadesData ? {
            create: habilidadesData,
          } : undefined,
        },
        include: {
          empresa: true,
          oferta_habilidad: {
            include: {
              habilidad: true,
            },
          },
        },
      });
    });
  }

  async delete(id: string, userId: string, userRole: string) {
    const oferta = await this.prisma.ofertaLaboral.findUnique({
      where: { id },
      include: { empresa: true },
    });

    if (!oferta) {
      throw new NotFoundException('Oferta no encontrada');
    }

    if (userRole !== 'ADMIN' && oferta.empresa.user_id !== userId) {
      throw new ForbiddenException('No tiene permisos para eliminar esta oferta');
    }

    return this.prisma.ofertaLaboral.delete({
      where: { id },
    });
  }

  async findById(id: string) {
    const oferta = await this.prisma.ofertaLaboral.findUnique({
      where: { id },
      include: {
        empresa: true,
        oferta_habilidad: {
          include: {
            habilidad: true,
          },
        },
      },
    });

    if (!oferta) {
      throw new NotFoundException('Oferta no encontrada');
    }

    return oferta;
  }

  async findAll(filters: FilterOfertaDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.ciudad) {
      where.ciudad = { contains: filters.ciudad, mode: 'insensitive' };
    }
    if (filters.pais) {
      where.pais = { contains: filters.pais, mode: 'insensitive' };
    }
    if (filters.modalidad) {
      where.modalidad = filters.modalidad;
    }
    if (filters.tipo_contrato) {
      where.tipo_contrato = filters.tipo_contrato;
    }
    if (filters.salario_min) {
      where.salario_max = { gte: filters.salario_min };
    }
    if (filters.salario_max) {
      where.salario_min = { lte: filters.salario_max };
    }
    if (filters.activa !== undefined) {
      where.activa = filters.activa;
    }
    if (filters.fecha_cierre_desde) {
      where.fecha_cierre = { ...where.fecha_cierre, gte: new Date(filters.fecha_cierre_desde) };
    }
    if (filters.fecha_cierre_hasta) {
      where.fecha_cierre = { ...where.fecha_cierre, lte: new Date(filters.fecha_cierre_hasta) };
    }

    if (filters.habilidades && filters.habilidades.length > 0) {
      where.oferta_habilidad = {
        some: {
          habilidad_id: { in: filters.habilidades },
        },
      };
    }

    const [ofertas, total] = await Promise.all([
      this.prisma.ofertaLaboral.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          empresa: true,
          oferta_habilidad: {
            include: {
              habilidad: true,
            },
          },
        },
      }),
      this.prisma.ofertaLaboral.count({ where }),
    ]);

    return {
      data: ofertas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async misOfertas(userId: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { user_id: userId },
    });

    if (!empresa) {
      throw new ForbiddenException('Solo las empresas tienen ofertas');
    }

    return this.prisma.ofertaLaboral.findMany({
      where: { empresa_id: empresa.id },
      orderBy: { created_at: 'desc' },
      include: {
        empresa: true,
        oferta_habilidad: {
          include: {
            habilidad: true,
          },
        },
        _count: {
          select: { postulaciones: true },
        },
      },
    });
  }

  async postulacion(ofertaId: string, userId: string, cartaPresentacion?: string) {
    const egresado = await this.prisma.egresado.findUnique({
      where: { user_id: userId },
    });

    if (!egresado) {
      throw new ForbiddenException('Solo los egresados pueden postulár');
    }

    const oferta = await this.prisma.ofertaLaboral.findUnique({
      where: { id: ofertaId },
    });

    if (!oferta) {
      throw new NotFoundException('Oferta no encontrada');
    }

    if (!oferta.activa) {
      throw new BadRequestException('La oferta no está activa');
    }

    if (oferta.fecha_cierre && new Date(oferta.fecha_cierre) < new Date()) {
      throw new BadRequestException('La fecha de cierre ha pasado');
    }

    const existente = await this.prisma.postulacion.findUnique({
      where: {
        oferta_id_egresado_id: {
          oferta_id: ofertaId,
          egresado_id: egresado.id,
        },
      },
    });

    if (existente) {
      throw new BadRequestException('Ya te has postulado a esta oferta');
    }

    return this.prisma.postulacion.create({
      data: {
        oferta_id: ofertaId,
        egresado_id: egresado.id,
        carta_presentacion: cartaPresentacion,
        estado: EstadoPostulacion.POSTULADO,
      },
      include: {
        oferta: {
          include: { empresa: true },
        },
        egresado: true,
      },
    });
  }

  async postulacionesRecibidas(userId: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { user_id: userId },
    });

    if (!empresa) {
      throw new ForbiddenException('Solo las empresas ven postulaciones');
    }

    const ofertas = await this.prisma.ofertaLaboral.findMany({
      where: { empresa_id: empresa.id },
      select: { id: true },
    });

    const ofertaIds = ofertas.map(o => o.id);

    return this.prisma.postulacion.findMany({
      where: { oferta_id: { in: ofertaIds } },
      orderBy: { fecha_postulacion: 'desc' },
      include: {
        oferta: {
          include: { empresa: true },
        },
        egresado: {
          include: {
            user: { select: { email: true } },
            formacion_academica: {
              include: { carrera: true },
            },
            experiencia_laboral: true,
            egresado_habilidad: {
              include: { habilidad: true },
            },
          },
        },
        postulacion_historial: {
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }

  async actualizarEstado(postulacionId: string, estado: string, userId: string, userRole: string, comentario?: string) {
    const postulacion = await this.prisma.postulacion.findUnique({
      where: { id: postulacionId },
      include: {
        oferta: { include: { empresa: true } },
        egresado: { include: { user: true } },
      },
    });

    if (!postulacion) {
      throw new NotFoundException('Postulación no encontrada');
    }

    if (userRole === 'EMPRESA' && postulacion.oferta.empresa.user_id !== userId) {
      throw new ForbiddenException('No tiene permisos para actualizar esta postulación');
    }

    if (userRole === 'EGRESADO' && postulacion.egresado.user_id !== userId) {
      throw new ForbiddenException('No tiene permisos para actualizar esta postulación');
    }

    const estadoAnterior = postulacion.estado;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.postulacion.update({
        where: { id: postulacionId },
        data: { estado: estado as EstadoPostulacion },
        include: {
          oferta: { include: { empresa: true } },
          egresado: { include: { user: true } },
        },
      });

      await tx.postulacionHistorial.create({
        data: {
          postulacion_id: postulacionId,
          estado_anterior: estadoAnterior as EstadoPostulacion,
          estado_nuevo: estado as EstadoPostulacion,
          comentario,
          cambiado_por: userId,
        },
      });

      const titulos: Record<string, string> = {
        POSTULADO: 'Postulación Recibida',
        EN_REVISION: 'Postulación en Revisión',
        ENTREVISTA: 'Invitación a Entrevista',
        CONTRATADO: '¡Felicidades! Has sido Contratado',
        RECHAZADO: 'Actualización de Postulación',
      };

      const mensajes: Record<string, string> = {
        POSTULADO: `Tu postulación para "${postulacion.oferta.titulo}" ha sido recibida.`,
        EN_REVISION: `Tu postulación para "${postulacion.oferta.titulo}" está siendo revisada por la empresa.`,
        ENTREVISTA: `¡Congratulations! Has sido invitado a entrevista para "${postulacion.oferta.titulo}".`,
        CONTRATADO: `¡Felicidades! Has sido contratado para "${postulacion.oferta.titulo}".`,
        RECHAZADO: `Tu postulación para "${postulacion.oferta.titulo}" no fue seleccionada.`,
      };

      await tx.notificacion.create({
        data: {
          usuario_id: postulacion.egresado.user_id,
          tipo: 'POSTULACION',
          titulo: titulos[estado] || 'Actualización de Postulación',
          mensaje: mensajes[estado] || `Hubo un cambio en tu postulación para "${postulacion.oferta.titulo}".`,
          datos_adicionales: {
            postulacion_id: postulacionId,
            oferta_id: postulacion.oferta_id,
            estado,
            comentario,
          },
        },
      });

      return updated;
    });

    return result;
  }
}