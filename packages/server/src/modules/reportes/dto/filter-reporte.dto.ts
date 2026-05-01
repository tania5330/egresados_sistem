import { z } from 'zod';

export const filterReportesSchema = z.object({
  tipo: z.string().optional(),
  estado: z.enum(['PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR']).optional(),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export class FilterReporteDto {
  tipo?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}