import { z } from 'zod';

export type RouterInputs = {
  auth: {
    login: { email: string; password: string };
    register: { email: string; password: string; role: string };
    registerEgresado: { email: string; password: string; nombres: string; apellidos: string };
    registerEmpresa: { email: string; password: string; nombre: string; nit: string };
    logout: Record<string, never>;
    refreshToken: { userId: string };
  };
  dashboard: {
    getAdminDashboard: {
      fechaInicio?: string;
      fechaFin?: string;
      carreraId?: string;
      facultadId?: string;
      sector?: string;
      ciudad?: string;
      pais?: string;
      anioEgreso?: number;
      limite?: number;
      topHabilidades?: number;
    };
    getEmpresaDashboard: {
      fechaInicio?: string;
      fechaFin?: string;
      ofertaId?: string;
      limite?: number;
    };
    getEgresadoDashboard: {
      fechaInicio?: string;
      fechaFin?: string;
      limiteOfertas?: number;
    };
    invalidateCache: {
      pattern?: string;
    };
  };
};

export type RouterOutputs = {
  auth: {
    login: { accessToken: string; refreshToken: string };
    register: { accessToken: string; refreshToken: string };
    registerEgresado: { accessToken: string; refreshToken: string };
    registerEmpresa: { accessToken: string; refreshToken: string };
    logout: { message: string };
    refreshToken: { accessToken: string; refreshToken: string };
  };
  dashboard: {
    getAdminDashboard: {
      kpis: { total_egresados: number; total_empresas: number; ofertas_activas: number; tasa_empleabilidad: number };
      distribucionEgresados: Array<{ carrera_id: string | null; carrera: string | null; facultad: string | null; total_egresados: number; egresados_empleados: number; tasa_empleabilidad: number }>;
      demandaHabilidades: Array<{ habilidad_id: string; habilidad: string; tipo: string; categoria: string | null; total_ofertas: number; ofertas_obligatoria: number; ofertas_deseable: number }>;
      ofertasPorMes: Array<{ mes: Date; total_ofertas: number; empresas_unicas: number }>;
      postulacionesPorMes: Array<{ mes: Date; total_postulaciones: number; ofertas_postuladas: number; egresados_unicos: number }>;
      tasaContratacionCohorte: Array<{ anio_egreso: number; carrera: string; total_egresados: number; contratados: number; tasa_contratacion: number }>;
      ofertasPorUbicacion: Array<{ ciudad: string; pais: string; total_ofertas: number; empresas_unicas: number; salario_promedio_min: number | null; salario_promedio_max: number | null }>;
    };
    getEmpresaDashboard: {
      ofertasPublicadas: number;
      ofertasActivas: number;
      postulacionesRecibidas: number;
      candidatosContratados: number;
      ofertasHistorico: Array<{ id: string; titulo: string; fechaPublicacion: Date; ciudad: string | null; salarioMin: number | null; salarioMax: number | null; modalidad: string; tipoContrato: string }>;
      postulacionesRecibidasList: Array<{ id: string; ofertaId: string; ofertaTitulo: string; empresaNombre: string | null; estado: string; fechaPostulacion: Date }>;
      ofertasPorMes: Array<{ mes: Date; total_ofertas: number; empresas_unicas: number }>;
      rendimientoPromedio: number;
    };
    getEgresadoDashboard: {
      postulacionesTotales: number;
      ofertasVistas: number;
      tasaRespuesta: number;
      ofertasRecomendadas: Array<{ id: string; titulo: string; fechaPublicacion: Date; ciudad: string | null; salarioMin: number | null; salarioMax: number | null; modalidad: string; tipoContrato: string }>;
      postulacionesRecientes: Array<{ id: string; ofertaId: string; ofertaTitulo: string; empresaNombre: string | null; estado: string; fechaPostulacion: Date }>;
      estadoPostulaciones: { POSTULADO: number; EN_REVISION: number; ENTREVISTA: number; CONTRATADO: number; RECHAZADO: number };
    };
    invalidateCache: { success: boolean; message: string };
  };
};

export { z };
