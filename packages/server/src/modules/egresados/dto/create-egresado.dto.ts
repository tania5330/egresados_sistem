import { IsString, IsOptional, IsEnum, IsBoolean, IsDate, IsUUID, IsArray, ValidateNested, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum Genero {
  M = 'M',
  F = 'F',
  O = 'O',
}

export enum NivelHabilidad {
  BASICO = 'BASICO',
  INTERMEDIO = 'INTERMEDIO',
  AVANZADO = 'AVANZADO',
  EXPERTO = 'EXPERTO',
}

export class CreateFormacionAcademicaDto {
  @IsString()
  @MinLength(1)
  institucion: string;

  @IsString()
  @MinLength(1)
  titulo: string;

  @IsOptional()
  @IsString()
  carrera?: string;

  @IsUUID()
  @IsOptional()
  carrera_id?: string;

  @IsDate()
  @Type(() => Date)
  fecha_inicio: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fecha_fin?: Date;

  @IsBoolean()
  culminada: boolean = true;
}

export class CreateExperienciaLaboralDto {
  @IsString()
  @MinLength(1)
  empresa: string;

  @IsString()
  @MinLength(1)
  cargo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsDate()
  @Type(() => Date)
  fecha_inicio: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fecha_fin?: Date;

  @IsBoolean()
  trabajo_actual: boolean = false;
}

export class CreateHabilidadDto {
  @IsUUID()
  habilidad_id: string;

  @IsEnum(NivelHabilidad)
  nivel: NivelHabilidad;
}

export class CreateEgresadoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  nombres: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  apellidos: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fecha_nacimiento?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  foto_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cv_url?: string;

  @IsOptional()
  @IsString()
  biografia?: string;

  @IsOptional()
  @IsEnum(Genero)
  genero?: Genero;

  @IsBoolean()
  buscando_empleo: boolean = true;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFormacionAcademicaDto)
  formacion_academica?: CreateFormacionAcademicaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExperienciaLaboralDto)
  experiencia_laboral?: CreateExperienciaLaboralDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHabilidadDto)
  habilidades?: CreateHabilidadDto[];
}