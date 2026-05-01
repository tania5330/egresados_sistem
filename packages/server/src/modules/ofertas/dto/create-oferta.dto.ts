import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean, IsDateString, IsArray, Min, IsUUID } from 'class-validator';

export enum ModalidadOferta {
  PRESENCIAL = 'PRESENCIAL',
  REMOTO = 'REMOTO',
  HIBRIDO = 'HIBRIDO',
}

export enum TipoContrato {
  TIEMPO_COMPLETO = 'TIEMPO_COMPLETO',
  PARCIAL = 'PARCIAL',
  POR_HORA = 'POR_HORA',
  PROYECTO = 'PROYECTO',
}

export class CreateOfertaDto {
  @IsString()
  titulo: string;

  @IsString()
  descripcion: string;

  @IsOptional()
  @IsString()
  requisitos?: string;

  @IsOptional()
  @IsString()
  beneficios?: string;

  @IsEnum(ModalidadOferta)
  modalidad: ModalidadOferta;

  @IsEnum(TipoContrato)
  tipo_contrato: TipoContrato;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salario_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salario_max?: number;

  @IsOptional()
  @IsString()
  moneda?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  pais?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsNumber()
  @Min(1)
  plazas_disponibles: number;

  @IsOptional()
  @IsDateString()
  fecha_cierre?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  habilidades?: { id: string; obligatoria: boolean }[];
}