import { z } from 'zod';

export enum TipoReporte {
  LISTADO_EGRESADOS = 'LISTADO_EGRESADOS',
  LISTADO_OFERTAS = 'LISTADO_OFERTAS',
  POSTULACIONES_POR_OFERTA = 'POSTULACIONES_POR_OFERTA',
  REPORTE_EMPLEABILIDAD = 'REPORTE_EMPLEABILIDAD',
  REPORTE_DEMANDA_LABORAL = 'REPORTE_DEMANDA_LABORAL',
  REPORTE_COMPARATIVO_COHORTE = 'REPORTE_COMPARATIVO_COHORTE',
}

export enum EstadoReporte {
  PENDIENTE = 'PENDIENTE',
  PROCESANDO = 'PROCESANDO',
  COMPLETADO = 'COMPLETADO',
  ERROR = 'ERROR',
}

export const filtrosListadoEgresadosSchema = z.object({
  carreraIds: z.array(z.string().uuid()).optional(),
  anioEgresoDesde: z.number().int().min(2000).max(2030).optional(),
  anioEgresoHasta: z.number().int().min(2000).max(2030).optional(),
  habilidadIds: z.array(z.string().uuid()).optional(),
 soloBuscandoEmpleo: z.boolean().optional(),
  facultadId: z.string().uuid().optional(),
});

export const filtrosListadoOfertasSchema = z.object({
  activa: z.boolean().optional(),
  ciudad: z.string().optional(),
  pais: z.string().optional(),
  modalidad: z.enum(['PRESENCIAL', 'REMOTO', 'HIBRIDO']).optional(),
  tipoContrato: z.enum(['TIEMPO_COMPLETO', 'PARCIAL', 'POR_HORA', 'PROYECTO']).optional(),
  salarioMin: z.number().positive().optional(),
  salarioMax: z.number().positive().optional(),
  fechaPublicacionDesde: z.string().datetime().optional(),
  fechaPublicacionHasta: z.string().datetime().optional(),
  habilidadIds: z.array(z.string().uuid()).optional(),
});

export const filtrosPostulacionesPorOfertaSchema = z.object({
  ofertaId: z.string().uuid(),
  estado: z.enum(['POSTULADO', 'EN_REVISION', 'ENTREVISTA', 'CONTRATADO', 'RECHAZADO']).optional(),
});

export const filtrosReporteEmpleabilidadSchema = z.object({
  carreraIds: z.array(z.string().uuid()).optional(),
  anioEgresoDesde: z.number().int().min(2000).max(2030).optional(),
  anioEgresoHasta: z.number().int().min(2000).max(2030).optional(),
  facultadId: z.string().uuid().optional(),
});

export const filtrosReporteDemandaLaboralSchema = z.object({
  topHabilidades: z.number().int().min(1).max(100).optional().default(20),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional(),
});

export const filtrosReporteComparativoCohorteSchema = z.object({
  anioDesde: z.number().int().min(2000).max(2030),
  anioHasta: z.number().int().min(2000).max(2030),
  carreraIds: z.array(z.string().uuid()).optional(),
});

export const createReporteSchema = z.object({
  tipo: z.nativeEnum(TipoReporte),
  filtros: z.record(z.any()).optional(),
});

export type FiltrosListadoEgresados = z.infer<typeof filtrosListadoEgresadosSchema>;
export type FiltrosListadoOfertas = z.infer<typeof filtrosListadoOfertasSchema>;
export type FiltrosPostulacionesPorOferta = z.infer<typeof filtrosPostulacionesPorOfertaSchema>;
export type FiltrosReporteEmpleabilidad = z.infer<typeof filtrosReporteEmpleabilidadSchema>;
export type FiltrosReporteDemandaLaboral = z.infer<typeof filtrosReporteDemandaLaboralSchema>;
export type FiltrosReporteComparativoCohorte = z.infer<typeof filtrosReporteComparativoCohorteSchema>;
export type CreateReporteInput = z.infer<typeof createReporteSchema>;