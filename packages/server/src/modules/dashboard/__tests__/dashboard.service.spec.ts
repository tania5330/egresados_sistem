import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardService } from '../dashboard.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../common/services/cache.service';
import { AdminDashboardFiltersDto } from '../dto/dashboard-filters.dto';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;
  let cache: CacheService;

  const mockKpisGenerales = {
    total_egresados: 150,
    total_empresas: 25,
    ofertas_activas: 42,
    tasa_empleabilidad: 67.5,
  };

  const mockAdminDashboardResult = {
    kpis: mockKpisGenerales,
    distribucionEgresados: [
      {
        carrera_id: 'carrera-1',
        carrera: 'Ingeniería de Software',
        facultad: 'Ingeniería',
        total_egresados: 50,
        egresados_empleados: 35,
        tasa_empleabilidad: 70.0,
      },
    ],
    demandaHabilidades: [
      {
        habilidad_id: 'hab-1',
        habilidad: 'JavaScript',
        tipo: 'PROGRAMMING',
        categoria: 'Desarrollo',
        total_ofertas: 30,
        ofertas_obligatoria: 20,
        ofertas_deseable: 10,
      },
    ],
    ofertasPorMes: [
      {
        mes: new Date('2024-01-01'),
        total_ofertas: 15,
        empresas_unicas: 10,
      },
    ],
    postulacionesPorMes: [
      {
        mes: new Date('2024-01-01'),
        total_postulaciones: 45,
        ofertas_postuladas: 30,
        egresados_unicos: 25,
      },
    ],
    tasaContratacionCohorte: [
      {
        anio_egreso: 2023,
        carrera: 'Ingeniería de Software',
        total_egresados: 40,
        contratados: 28,
        tasa_contratacion: 70.0,
      },
    ],
    ofertasPorUbicacion: [
      {
        ciudad: 'Bogotá',
        pais: 'Colombia',
        total_ofertas: 20,
        empresas_unicas: 15,
        salario_promedio_min: 3500000,
        salario_promedio_max: 6000000,
      },
    ],
  };

  beforeEach(() => {
    prisma = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      $queryRawUnsafe: vi.fn().mockResolvedValue([]),
      ofertaLaboral: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
      },
      postulacion: {
        count: vi.fn().mockResolvedValue(0),
        groupBy: vi.fn().mockResolvedValue([]),
        findMany: vi.fn().mockResolvedValue([]),
      },
      empresa: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      egresado: {
        findUnique: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
      },
      user: {
        count: vi.fn().mockResolvedValue(0),
      },
      formacionAcademica: {
        count: vi.fn().mockResolvedValue(0),
      },
      experienciaLaboral: {
        count: vi.fn().mockResolvedValue(0),
      },
      egresadoHabilidad: {
        count: vi.fn().mockResolvedValue(0),
      },
      habilidad: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      carrera: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      ofertaHabilidad: {
        count: vi.fn().mockResolvedValue(0),
      },
    } as unknown as PrismaService;

    cache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      delPattern: vi.fn().mockResolvedValue(undefined),
    } as unknown as CacheService;

    service = new DashboardService(prisma, cache);
  });

  describe('getKpis', () => {
    it('should return correct KPI structure with all required fields', async () => {
      vi.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([mockKpisGenerales]);

      const result = await (service as any).getKpisGenerales();

      expect(result).toHaveProperty('total_egresados');
      expect(result).toHaveProperty('total_empresas');
      expect(result).toHaveProperty('ofertas_activas');
      expect(result).toHaveProperty('tasa_empleabilidad');
      expect(typeof result.total_egresados).toBe('number');
      expect(typeof result.total_empresas).toBe('number');
      expect(typeof result.ofertas_activas).toBe('number');
      expect(typeof result.tasa_empleabilidad).toBe('number');
    });

    it('should return zero values when database returns empty', async () => {
      const emptyKpis = {
        total_egresados: 0,
        total_empresas: 0,
        ofertas_activas: 0,
        tasa_empleabilidad: 0,
      };
      vi.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([emptyKpis]);

      const result = await (service as any).getKpisGenerales();

      expect(result.total_egresados).toBe(0);
      expect(result.total_empresas).toBe(0);
      expect(result.ofertas_activas).toBe(0);
      expect(result.tasa_empleabilidad).toBe(0);
    });
  });

  describe('getAdminDashboard', () => {
    it('should return cached result on second call with same filters', async () => {
      const filters: AdminDashboardFiltersDto = {
        fechaInicio: '2024-01-01',
        fechaFin: '2024-12-31',
      };

      vi.spyOn(cache, 'get').mockResolvedValueOnce(null).mockResolvedValueOnce(mockAdminDashboardResult);

      const mockKpisQuery = vi.spyOn(prisma, '$queryRaw').mockResolvedValue([mockKpisGenerales]);
      const mockDistribucionQuery = vi.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([]);
      const mockHabilidadesQuery = vi.spyOn(prisma, '$queryRaw').mockResolvedValue([]);
      const mockOfertasMesQuery = vi.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([]);
      const mockPostulacionesMesQuery = vi.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([]);
      const mockCohorteQuery = vi.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([]);
      const mockUbicacionQuery = vi.spyOn(prisma, '$queryRaw').mockResolvedValue([]);

      const firstResult = await service.getAdminDashboard(filters);

      expect(cache.get).toHaveBeenCalledWith(`admin_dashboard:${JSON.stringify(filters)}`);
      expect(firstResult).toBeDefined();

      const secondResult = await service.getAdminDashboard(filters);

      expect(secondResult).toEqual(mockAdminDashboardResult);
      expect(cache.get).toHaveBeenCalledTimes(2);
    });

    it('should hit database on first call when cache is empty', async () => {
      const filters: AdminDashboardFiltersDto = {};

      vi.spyOn(cache, 'get').mockResolvedValue(null);
      vi.spyOn(prisma, '$queryRaw').mockResolvedValue([mockKpisGenerales]);
      vi.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([]);

      await service.getAdminDashboard(filters);

      expect(cache.get).toHaveBeenCalled();
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should apply date range filters correctly', async () => {
      const filters: AdminDashboardFiltersDto = {
        fechaInicio: '2024-01-01',
        fechaFin: '2024-06-30',
      };

      vi.spyOn(cache, 'get').mockResolvedValue(null);
      const kpisSpy = vi.spyOn(prisma, '$queryRaw').mockResolvedValue([mockKpisGenerales]);
      const ofertasSpy = vi.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([]);
      const postulacionesSpy = vi.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([]);

      await service.getAdminDashboard(filters);

      expect(kpisSpy).toHaveBeenCalled();
      expect(ofertasSpy).toHaveBeenCalled();
      expect(postulacionesSpy).toHaveBeenCalled();
    });

    it('should return AdminDashboard with all required sections', async () => {
      const filters: AdminDashboardFiltersDto = {};

      vi.spyOn(cache, 'get').mockResolvedValue(null);
      vi.spyOn(prisma, '$queryRaw')
        .mockResolvedValueOnce([mockKpisGenerales])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      vi.spyOn(prisma, '$queryRawUnsafe')
        .mockResolvedValueOnce([{ carrera_id: '1', carrera: 'Test', facultad: 'Test', total_egresados: 10, egresados_empleados: 5, tasa_empleabilidad: 50 }])
        .mockResolvedValueOnce([{ habilidad_id: '1', habilidad: 'JS', tipo: 'PROGRAMMING', categoria: null, total_ofertas: 5, ofertas_obligatoria: 3, ofertas_deseable: 2 }])
        .mockResolvedValueOnce([{ mes: new Date(), total_ofertas: 10, empresas_unicas: 5 }])
        .mockResolvedValueOnce([{ mes: new Date(), total_postulaciones: 20, ofertas_postuladas: 15, egresados_unicos: 10 }])
        .mockResolvedValueOnce([{ anio_egreso: 2023, carrera: 'Test', total_egresados: 20, contratados: 14, tasa_contratacion: 70 }])
        .mockResolvedValueOnce([{ ciudad: 'Bogotá', pais: 'Colombia', total_ofertas: 10, empresas_unicas: 8, salario_promedio_min: 3000000, salario_promedio_max: 5000000 }]);

      const result = await service.getAdminDashboard(filters);

      expect(result).toHaveProperty('kpis');
      expect(result).toHaveProperty('distribucionEgresados');
      expect(result).toHaveProperty('demandaHabilidades');
      expect(result).toHaveProperty('ofertasPorMes');
      expect(result).toHaveProperty('postulacionesPorMes');
      expect(result).toHaveProperty('tasaContratacionCohorte');
      expect(result).toHaveProperty('ofertasPorUbicacion');
    });
  });

  describe('cache implementation', () => {
    it('should store result in cache after database query', async () => {
      const filters: AdminDashboardFiltersDto = {};

      vi.spyOn(cache, 'get').mockResolvedValue(null);
      vi.spyOn(prisma, '$queryRaw').mockResolvedValue([mockKpisGenerales]);
      vi.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([]);

      await service.getAdminDashboard(filters);

      expect(cache.set).toHaveBeenCalledWith(
        expect.stringContaining('admin_dashboard:'),
        expect.any(Object),
        300
      );
    });

    it('should return cached value if available', async () => {
      const cachedData = { kpis: mockKpisGenerales, message: 'from cache' };
      vi.spyOn(cache, 'get').mockResolvedValue(cachedData);

      const result = await service.getAdminDashboard({});

      expect(result).toEqual(cachedData);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('should return null from cache when key does not exist', async () => {
      vi.spyOn(cache, 'get').mockResolvedValue(null);
      vi.spyOn(prisma, '$queryRaw').mockResolvedValue([mockKpisGenerales]);
      vi.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([]);

      const result = await service.getAdminDashboard({});

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('message');
    });
  });

  describe('invalidateCache', () => {
    it('should call cache.delPattern with pattern when provided', async () => {
      await service.invalidateCache('admin_dashboard:*');

      expect(cache.delPattern).toHaveBeenCalledWith('admin_dashboard:*');
    });

    it('should call cache.delPattern with wildcard when no pattern provided', async () => {
      await service.invalidateCache();

      expect(cache.delPattern).toHaveBeenCalledWith('*');
    });
  });
});