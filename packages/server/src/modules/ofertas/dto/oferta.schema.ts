import { z } from 'zod';
import { ModalidadOferta, TipoContrato } from './create-oferta.dto';

export const CreateOfertaSchema = z.object({
  titulo: z.string().min(1, 'Título es requerido'),
  descripcion: z.string().min(1, 'Descripción es requerida'),
  requisitos: z.string().optional(),
  beneficios: z.string().optional(),
  modalidad: z.nativeEnum(ModalidadOferta),
  tipo_contrato: z.nativeEnum(TipoContrato),
  salario_min: z.number().min(0).optional(),
  salario_max: z.number().min(0).optional(),
  moneda: z.string().optional(),
  ciudad: z.string().optional(),
  pais: z.string().optional(),
  activa: z.boolean().optional(),
  plazas_disponibles: z.number().min(1),
  fecha_cierre: z.string().optional(),
  habilidades: z.array(z.object({ id: z.string().uuid(), obligatoria: z.boolean() })).optional(),
});

export const UpdateOfertaSchema = CreateOfertaSchema.partial();

export const FilterOfertaSchema = z.object({
  ciudad: z.string().optional(),
  pais: z.string().optional(),
  modalidad: z.nativeEnum(ModalidadOferta).optional(),
  tipo_contrato: z.nativeEnum(TipoContrato).optional(),
  salario_min: z.number().optional(),
  salario_max: z.number().optional(),
  habilidades: z.array(z.string()).optional(),
  fecha_cierre_desde: z.string().optional(),
  fecha_cierre_hasta: z.string().optional(),
  activa: z.boolean().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
});
