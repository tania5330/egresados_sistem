import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOfertaDto, UpdateOfertaDto, FilterOfertaDto, ModalidadOferta, TipoContrato } from './dto/create-oferta.dto';
import { EstadoPostulacion } from './dto/postulacion.dto';

@Injectable()
export class OfertasService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOfertaDto, userId: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { usuario_id: userId },
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
        estado: dto.activa === false ? 'cerrada' : 'activa',
        plazas_disponibles: dto.plazas_disponibles,
        fecha_cierre: dto.fecha_cierre ? new Date(dto.fecha_cierre) : null,
        habilidades: {
          create: habilidadesData,
        },
      },
      include: {
        empresa: true,
        habilidades: {
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

    if (userRole !== 'ADMIN' && oferta.empresa.usuario_id !== userId) {
      throw new ForbiddenException('No tiene permisos para editar esta oferta');
    }

    const habilidadesData = dto.habilidades?.map(h => ({
      habilidad_id: h.id,
      obligatoria: h.obligatoria,
    }));

    return this.prisma.$transaction(async (tx) => {
      if (habilidadesData) {
        await tx.ofertaHabilidad.deleteMany({
          where: { oferta_laboral_id: id },
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
          estado: dto.activa === false ? 'cerrada' : 'activa',
          plazas_disponibles: dto.plazas_disponibles,
          fecha_cierre: dto.fecha_cierre ? new Date(dto.fecha_cierre) : null,
          habilidades: habilidadesData ? {
            create: habilidadesData,
          } : undefined,
        },
        include: {
          empresa: true,
          habilidades: {
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

    if (userRole !== 'ADMIN' && oferta.empresa.usuario_id !== userId) {
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
        habilidades: {
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

  async findAll(filters: FilterOfertaDto, userRole?: string) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userRole !== 'ADMIN') {
      where.estado = 'activa';
    }

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
    
    if (filters.fecha_cierre_desde) {
      where.fecha_cierre = { ...where.fecha_cierre, gte: new Date(filters.fecha_cierre_desde) };
    }
    if (filters.fecha_cierre_hasta) {
      where.fecha_cierre = { ...where.fecha_cierre, lte: new Date(filters.fecha_cierre_hasta) };
    }

    if (filters.habilidades && filters.habilidades.length > 0) {
      where.habilidades = {
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
        orderBy: { creado_at: 'desc' },
        include: {
          empresa: true,
          habilidades: {
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
      where: { usuario_id: userId },
    });

    if (!empresa) {
      throw new ForbiddenException('Solo las empresas tienen ofertas');
    }

    const ofertas = await this.prisma.ofertaLaboral.findMany({
      where: { empresa_id: empresa.id },
      orderBy: { creado_at: 'desc' },
      include: {
        empresa: true,
        habilidades: {
          include: {
            habilidad: true,
          },
        },
        _count: {
          select: { postulaciones: true },
        },
      },
    });

    return ofertas.map(o => ({
      ...o,
      fechaPublicacion: o.creado_at,
      postulacionesCount: o._count.postulaciones,
    }));
  }

  async postulacion(offerId: string, userId: string, cartaPresentacion?: string) {
    const egresado = await this.prisma.egresado.findUnique({
      where: { usuario_id: userId },
    });

    if (!egresado) {
      throw new ForbiddenException('Solo los egresados pueden postular');
    }

    const oferta = await this.prisma.ofertaLaboral.findUnique({
      where: { id: offerId },
    });

    if (!oferta) {
      throw new NotFoundException('Oferta no encontrada');
    }

    if (oferta.estado !== 'activa') {
      throw new BadRequestException('La oferta no está activa');
    }

    if (oferta.fecha_cierre && new Date(oferta.fecha_cierre) < new Date()) {
      throw new BadRequestException('La fecha de cierre ha pasado');
    }

    const existente = await this.prisma.postulacion.findFirst({
      where: {
        oferta_id: offerId,
        egresado_id: egresado.id,
      },
    });

    if (existente) {
      throw new BadRequestException('Ya te has postulado a esta oferta');
    }

    return this.prisma.postulacion.create({
      data: {
        oferta_id: offerId,
        egresado_id: egresado.id,
        carta_presentacion: cartaPresentacion,
        estado: EstadoPostulacion.POSTULADO,
        historial_estados: {
          create: {
            estado_nuevo: EstadoPostulacion.POSTULADO,
          }
        }
      },
      include: {
        oferta_laboral: {
          include: { empresa: true },
        },
        egresado: true,
      },
    });
  }

  async postulacionesRecibidas(userId: string, userRole?: string) {
    let where: any = {};
    
    if (userRole === 'ADMIN') {
      where = {};
    } else {
      const empresa = await this.prisma.empresa.findUnique({
        where: { usuario_id: userId },
      });

      if (!empresa) {
        throw new ForbiddenException('Solo las empresas ven postulaciones');
      }
      where = { 
        oferta_laboral: {
          empresa_id: empresa.id
        }
      };
    }

    const postulaciones = await this.prisma.postulacion.findMany({
      where,
      orderBy: { fecha_postulacion: 'desc' },
      include: {
        oferta_laboral: {
          include: { empresa: true },
        },
        egresado: {
          include: {
            usuario: { select: { email: true } },
            formacion_academica: {
              include: { carrera: true },
            },
            experiencia_laboral: true,
            habilidades: {
              include: { habilidad: true },
            },
          },
        },
        historial_estados: {
          orderBy: { fecha: 'desc' },
        },
      },
    });

    return postulaciones.map(p => ({
      ...p,
      egresadoEmail: p.egresado.usuario.email,
      ofertaTitulo: p.oferta_laboral.titulo,
      empresaNombre: p.oferta_laboral.empresa.nombre,
      fechaPostulacion: p.fecha_postulacion,
    }));
  }

  async misPostulaciones(userId: string, userRole?: string) {
    let where: any = {};
    
    if (userRole === 'ADMIN') {
      // Si es admin, ve todas las postulaciones
      where = {};
    } else {
      const egresado = await this.prisma.egresado.findUnique({
        where: { usuario_id: userId },
      });

      if (!egresado) {
        throw new ForbiddenException('Solo los egresados ven sus postulaciones');
      }
      where = { egresado_id: egresado.id };
    }

    const postulaciones = await this.prisma.postulacion.findMany({
      where,
      orderBy: { fecha_postulacion: 'desc' },
      include: {
        oferta_laboral: {
          include: { empresa: true },
        },
        egresado: {
          include: { usuario: { select: { email: true } } }
        },
        historial_estados: {
          orderBy: { fecha: 'desc' },
        },
      },
    });

    return postulaciones.map(p => ({
      ...p,
      ofertaId: p.oferta_id,
      ofertaTitulo: p.oferta_laboral.titulo,
      empresaNombre: p.oferta_laboral.empresa.nombre,
      egresadoEmail: p.egresado?.usuario?.email,
      fechaPostulacion: p.fecha_postulacion,
    }));
  }

  async actualizarEstado(applicationId: string, estado: string, userId: string, userRole: string, comentario?: string) {
    const postulacion = await this.prisma.postulacion.findUnique({
      where: { id: applicationId },
      include: {
        oferta_laboral: { include: { empresa: true } },
        egresado: { include: { usuario: true } },
      },
    });

    if (!postulacion) {
      throw new NotFoundException('Postulación no encontrada');
    }

    if (userRole === 'EMPRESA' && postulacion.oferta_laboral.empresa.usuario_id !== userId) {
      throw new ForbiddenException('No tiene permisos para actualizar esta postulación');
    }

    const estadoAnterior = postulacion.estado;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.postulacion.update({
        where: { id: applicationId },
        data: { estado: estado as EstadoPostulacion },
        include: {
          oferta_laboral: { include: { empresa: true } },
          egresado: { include: { usuario: true } },
        },
      });

      await tx.historialEstadoPostulacion.create({
        data: {
          postulacion_id: applicationId,
          estado_anterior: estadoAnterior as EstadoPostulacion,
          estado_nuevo: estado as EstadoPostulacion,
          comentario,
          cambiado_por_id: userId,
        },
      });

      if (estado === EstadoPostulacion.CONTRATADO) {
        await tx.contratacion.create({
          data: {
            empresa_id: postulacion.oferta_laboral.empresa_id,
            egresado_id: postulacion.egresado_id,
            oferta_id: postulacion.oferta_id,
          }
        });
      }

      await tx.notificacion.create({
        data: {
          usuario_id: postulacion.egresado.usuario_id,
          tipo: 'POSTULACION',
          titulo: 'Actualización de Postulación',
          mensaje: `Hubo un cambio en tu postulación para "${postulacion.oferta_laboral.titulo}".`,
          datos_adicionales: {
            postulacion_id: applicationId,
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
