export interface KpisGenerales {
  total_egresados: number;
  total_empresas: number;
  ofertas_activas: number;
  tasa_empleabilidad: number;
}

export interface DistribucionEgresados {
  carrera_id: string | null;
  carrera: string | null;
  facultad: string | null;
  total_egresados: number;
  egresados_empleados: number;
  tasa_empleabilidad: number;
}

export interface DemandaHabilidades {
  habilidad_id: string;
  habilidad: string;
  tipo: string;
  categoria: string | null;
  total_ofertas: number;
  ofertas_obligatoria: number;
  ofertas_deseable: number;
}

export interface OfertasPorMes {
  mes: Date;
  total_ofertas: number;
  empresas_unicas: number;
}

export interface PostulacionesPorMes {
  mes: Date;
  total_postulaciones: number;
  ofertas_postuladas: number;
  egresados_unicos: number;
}

export interface TasaContratacionCohorte {
  anio_egreso: number;
  carrera: string;
  total_egresados: number;
  contratados: number;
  tasa_contratacion: number;
}

export interface OfertasPorUbicacion {
  ciudad: string;
  pais: string;
  total_ofertas: number;
  empresas_unicas: number;
  salario_promedio_min: number | null;
  salario_promedio_max: number | null;
}

export interface AdminDashboard {
  kpis: KpisGenerales;
  distribucionEgresados: DistribucionEgresados[];
  demandaHabilidades: DemandaHabilidades[];
  ofertasPorMes: OfertasPorMes[];
  postulacionesPorMes: PostulacionesPorMes[];
  tasaContratacionCohorte: TasaContratacionCohorte[];
  ofertasPorUbicacion: OfertasPorUbicacion[];
}

export interface DashboardFilters {
  fechaInicio?: string;
  fechaFin?: string;
  carreraId?: string;
  facultadId?: string;
}
