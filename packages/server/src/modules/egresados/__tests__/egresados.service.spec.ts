import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EgresadosService } from '../egresados.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('EgresadosService', () => {
  let service: EgresadosService;
  let prisma: PrismaService;

  const mockEgresado = {
    id: 'egresado-1',
    user_id: 'user-1',
    nombres: 'Juan',
    apellidos: 'Pérez',
    telefono: '3001234567',
    fecha_nacimiento: new Date('1995-05-15'),
    foto_url: 'https://example.com/photo.jpg',
    cv_url: 'https://example.com/cv.pdf',
    biografia: 'Desarrollador Full Stack',
    genero: 'MASCULINO' as const,
    buscando_empleo: true,
    created_at: new Date(),
    updated_at: new Date(),
    user: { id: 'user-1', email: 'juan@example.com', role: 'EGRESADO' },
    formacion_academica: [
      {
        id: 'form-1',
        institucion: 'Universidad Nacional',
        titulo: 'Ingeniería de Software',
        carrera: 'Ingeniería de Software',
        carrera_id: 'carrera-1',
        fecha_inicio: new Date('2016-01-01'),
        fecha_fin: new Date('2021-12-31'),
        culminada: true,
      },
    ],
    experiencia_laboral: [
      {
        id: 'exp-1',
        empresa: 'Tech Corp',
        cargo: 'Desarrollador Junior',
        descripcion: 'Desarrollo de aplicaciones web',
        fecha_inicio: new Date('2022-01-01'),
        fecha_fin: null,
        trabajo_actual: true,
      },
    ],
    habilidades: [
      {
        id: 'eh-1',
        nivel: 'INTERMEDIO' as const,
        habilidad: {
          id: 'hab-1',
          nombre: 'JavaScript',
          tipo: 'PROGRAMMING',
          categoria: 'Desarrollo',
        },
      },
    ],
  };

  const mockEgresadosList = [mockEgresado, { ...mockEgresado, id: 'egresado-2', user_id: 'user-2' }];

  beforeEach(() => {
    prisma = {
      egresado: {
        create: vi.fn().mockResolvedValue(mockEgresado),
        findMany: vi.fn().mockResolvedValue(mockEgresadosList),
        findUnique: vi.fn().mockResolvedValue(mockEgresado),
        update: vi.fn().mockResolvedValue(mockEgresado),
        delete: vi.fn().mockResolvedValue(mockEgresado),
        count: vi.fn().mockResolvedValue(2),
      },
      formacionAcademica: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      experienciaLaboral: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      egresadoHabilidad: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
        count: vi.fn().mockResolvedValue(5),
      },
      postulacion: {
        count: vi.fn().mockResolvedValue(10),
      },
      user: {
        count: vi.fn().mockResolvedValue(100),
      },
      carrera: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      habilidad: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      ofertaHabilidad: {
        count: vi.fn().mockResolvedValue(20),
      },
    } as unknown as PrismaService;

    service = new EgresadosService(prisma);
  });

  describe('list with filters', () => {
    it('should return paginated list of egresados', async () => {
      const filters = { page: 1, limit: 10 };
      const result = await service.findAll(filters, 'ADMIN', 'admin-user');

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter by buscando_empleo status', async () => {
      const filters = { buscando_empleo: true };
      const findManySpy = vi.spyOn(prisma.egresado, 'findMany').mockResolvedValueOnce([mockEgresado]);
      const countSpy = vi.spyOn(prisma.egresado, 'count').mockResolvedValueOnce(1);

      await service.findAll(filters, 'ADMIN', 'admin-user');

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            buscando_empleo: true,
          }),
        })
      );
    });

    it('should filter by genero', async () => {
      const filters = { genero: 'MASCULINO' as const };
      const findManySpy = vi.spyOn(prisma.egresado, 'findMany').mockResolvedValueOnce([mockEgresado]);

      await service.findAll(filters, 'ADMIN', 'admin-user');

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            genero: 'MASCULINO',
          }),
        })
      );
    });

    it('should filter by search term in nombres or apellidos', async () => {
      const filters = { search: 'Juan' };
      const findManySpy = vi.spyOn(prisma.egresado, 'findMany').mockResolvedValueOnce([mockEgresado]);

      await service.findAll(filters, 'ADMIN', 'admin-user');

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ nombres: expect.objectContaining({ contains: 'Juan' }) }),
              expect.objectContaining({ apellidos: expect.objectContaining({ contains: 'Juan' }) }),
            ]),
          }),
        })
      );
    });

    it('should filter by habilidad_ids', async () => {
      const filters = { habilidad_ids: ['hab-1', 'hab-2'] };
      const findManySpy = vi.spyOn(prisma.egresado, 'findMany').mockResolvedValueOnce([mockEgresado]);

      await service.findAll(filters, 'ADMIN', 'admin-user');

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            egresado_habilidad: {
              some: {
                habilidad_id: { in: ['hab-1', 'hab-2'] },
              },
            },
          }),
        })
      );
    });

    it('should exclude inactive users for non-admin roles', async () => {
      const filters = {};
      const findManySpy = vi.spyOn(prisma.egresado, 'findMany').mockResolvedValueOnce([mockEgresado]);

      await service.findAll(filters, 'EGRESADO', 'user-1');

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: { is_active: true },
          }),
        })
      );
    });
  });

  describe('create', () => {
    it('should create a new egresado for admin user', async () => {
      const createDto = {
        nombres: 'Juan',
        apellidos: 'Pérez',
        telefono: '3001234567',
        fecha_nacimiento: new Date('1995-05-15'),
        foto_url: 'https://example.com/photo.jpg',
        cv_url: 'https://example.com/cv.pdf',
        biografia: 'Desarrollador Full Stack',
        genero: 'MASCULINO' as const,
        buscando_empleo: true,
      };

      const result = await service.create(createDto, 'user-1');

      expect(prisma.egresado.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: 'user-1',
            nombres: 'Juan',
            apellidos: 'Pérez',
          }),
        })
      );
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('nombres');
    });

    it('should include formacion academica when provided', async () => {
      const createDto = {
        nombres: 'Juan',
        apellidos: 'Pérez',
        formacion_academica: [
          {
            institucion: 'Universidad Nacional',
            titulo: 'Ingeniería de Software',
            carrera_id: 'carrera-1',
            fecha_inicio: new Date('2016-01-01'),
            fecha_fin: new Date('2021-12-31'),
            culminada: true,
          },
        ],
      };

      await service.create(createDto, 'user-1');

      expect(prisma.egresado.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            formacion_academica: {
              create: expect.any(Array),
            },
          }),
        })
      );
    });

    it('should include habilidades when provided', async () => {
      const createDto = {
        nombres: 'Juan',
        apellidos: 'Pérez',
        habilidades: [
          { habilidad_id: 'hab-1', nivel: 'INTERMEDIO' as const },
        ],
      };

      await service.create(createDto, 'user-1');

      expect(prisma.egresado.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            egresado_habilidad: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  habilidad_id: 'hab-1',
                  nivel: 'INTERMEDIO',
                }),
              ]),
            },
          }),
        })
      );
    });
  });

  describe('update', () => {
    it('should allow admin to update any egresado profile', async () => {
      const updateDto = { nombres: 'Juan Updated' };
      const adminUser = { ...mockEgresado, user: { ...mockEgresado.user, role: 'ADMIN' } };
      vi.spyOn(prisma.egresado, 'findUnique').mockResolvedValueOnce(adminUser);

      await service.update('egresado-1', updateDto, 'ADMIN', 'admin-user');

      expect(prisma.egresado.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'egresado-1' },
          data: expect.objectContaining({ nombres: 'Juan Updated' }),
        })
      );
    });

    it('should allow owner to update their own profile', async () => {
      const updateDto = { telefono: '3009876543' };
      vi.spyOn(prisma.egresado, 'findUnique').mockResolvedValueOnce(mockEgresado);

      await service.update('egresado-1', updateDto, 'EGRESADO', 'user-1');

      expect(prisma.egresado.update).toHaveBeenCalled();
    });

    it('should prevent non-owner from updating profile', async () => {
      const updateDto = { nombres: 'Hacker' };
      vi.spyOn(prisma.egresado, 'findUnique').mockResolvedValueOnce(mockEgresado);

      await expect(
        service.update('egresado-1', updateDto, 'EGRESADO', 'different-user')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when egresado does not exist', async () => {
      vi.spyOn(prisma.egresado, 'findUnique').mockResolvedValueOnce(null);

      await expect(
        service.update('non-existent', {}, 'ADMIN', 'admin-user')
      ).rejects.toThrow(NotFoundException);
    });

    it('should update formacion_academica when provided', async () => {
      const updateDto = {
        formacion_academica: [
          {
            institucion: 'Nueva Universidad',
            titulo: 'Nueva Carrera',
            fecha_inicio: new Date('2020-01-01'),
            culminada: true,
          },
        ],
      };
      vi.spyOn(prisma.egresado, 'findUnique').mockResolvedValueOnce(mockEgresado);

      await service.update('egresado-1', updateDto, 'ADMIN', 'admin-user');

      expect(prisma.formacionAcademica.deleteMany).toHaveBeenCalledWith({
        where: { egresado_id: 'egresado-1' },
      });
      expect(prisma.formacionAcademica.createMany).toHaveBeenCalled();
    });

    it('should update experiencia_laboral when provided', async () => {
      const updateDto = {
        experiencia_laboral: [
          {
            empresa: 'Nueva Empresa',
            cargo: 'Senior Developer',
            fecha_inicio: new Date('2023-01-01'),
            trabajo_actual: true,
          },
        ],
      };
      vi.spyOn(prisma.egresado, 'findUnique').mockResolvedValueOnce(mockEgresado);

      await service.update('egresado-1', updateDto, 'ADMIN', 'admin-user');

      expect(prisma.experienciaLaboral.deleteMany).toHaveBeenCalled();
      expect(prisma.experienciaLaboral.createMany).toHaveBeenCalled();
    });
  });

  describe('unauthorized access', () => {
    it('should throw ForbiddenException when non-admin tries to view another user profile', async () => {
      vi.spyOn(prisma.egresado, 'findUnique').mockResolvedValueOnce(mockEgresado);

      await expect(
        service.findOne('egresado-1', 'EGRESADO', 'different-user')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when non-admin tries to delete egresado', async () => {
      vi.spyOn(prisma.egresado, 'findUnique').mockResolvedValueOnce(mockEgresado);

      await expect(
        service.remove('egresado-1', 'EGRESADO')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to view any profile', async () => {
      vi.spyOn(prisma.egresado, 'findUnique').mockResolvedValueOnce(mockEgresado);

      const result = await service.findOne('egresado-1', 'ADMIN', 'admin-user');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('nombres');
    });

    it('should throw ForbiddenException when non-admin tries to get global stats', async () => {
      await expect(
        service.getGlobalStats('EGRESADO')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return egresado with all relations', async () => {
      vi.spyOn(prisma.egresado, 'findUnique').mockResolvedValueOnce(mockEgresado);

      const result = await service.findOne('egresado-1', 'ADMIN', 'admin-user');

      expect(result).toHaveProperty('formacion_academica');
      expect(result).toHaveProperty('experiencia_laboral');
      expect(result).toHaveProperty('habilidades');
      expect(result).toHaveProperty('user');
    });

    it('should throw NotFoundException when egresado not found', async () => {
      vi.spyOn(prisma.egresado, 'findUnique').mockResolvedValueOnce(null);

      await expect(
        service.findOne('non-existent', 'ADMIN', 'admin-user')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return complete stats for owner or admin', async () => {
      vi.spyOn(prisma.egresado, 'findUnique').mockResolvedValueOnce(mockEgresado);
      vi.spyOn(prisma.postulacion, 'count')
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);
      vi.spyOn(prisma.experienciaLaboral, 'count').mockResolvedValueOnce(2);
      vi.spyOn(prisma.formacionAcademica, 'count').mockResolvedValueOnce(1);

      const result = await service.getStats('egresado-1', 'EGRESADO', 'user-1');

      expect(result).toHaveProperty('postulaciones');
      expect(result).toHaveProperty('entrevistas');
      expect(result).toHaveProperty('contratados');
      expect(result).toHaveProperty('tasa_exito');
    });
  });
});