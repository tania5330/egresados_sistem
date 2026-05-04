import { z } from 'zod';
import { Genero, NivelHabilidad } from './create-egresado.dto';

export const CreateFormacionAcademicaSchema = z.object({
  institucion: z.string().min(1),
  titulo: z.string().min(1),
  carrera: z.string().optional(),
  carrera_id: z.string().uuid().optional(),
  fecha_inicio: z.date(),
  fecha_fin: z.date().optional(),
  culminada: z.boolean().default(true),
});

export const CreateExperienciaLaboralSchema = z.object({
  empresa: z.string().min(1),
  cargo: z.string().min(1),
  descripcion: z.string().optional(),
  fecha_inicio: z.date(),
  fecha_fin: z.date().optional(),
  trabajo_actual: z.boolean().default(false),
});

export const CreateHabilidadSchema = z.object({
  habilidad_id: z.string().uuid(),
  nivel: z.nativeEnum(NivelHabilidad),
});

export const CreateEgresadoSchema = z.object({
  nombres: z.string().min(1).max(255),
  apellidos: z.string().min(1).max(255),
  telefono: z.string().max(50).optional(),
  fecha_nacimiento: z.date().optional(),
  foto_url: z.string().max(500).optional(),
  cv_url: z.string().max(500).optional(),
  biografia: z.string().optional(),
  genero: z.nativeEnum(Genero).optional(),
  buscando_empleo: z.boolean().default(true),
  formacion_academica: z.array(CreateFormacionAcademicaSchema).optional(),
  experiencia_laboral: z.array(CreateExperienciaLaboralSchema).optional(),
  habilidades: z.array(CreateHabilidadSchema).optional(),
});

export const UpdateEgresadoSchema = CreateEgresadoSchema.partial();

export const FilterEgresadoSchema = z.object({
  search: z.string().optional(),
  carrera_id: z.string().uuid().optional(),
  anio_egreso: z.number().int().min(1900).max(2100).optional(),
  buscando_empleo: z.boolean().optional(),
  genero: z.nativeEnum(Genero).optional(),
  habilidad_ids: z.array(z.string().uuid()).optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
});
