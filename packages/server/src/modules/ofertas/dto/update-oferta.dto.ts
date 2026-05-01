import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean, IsDateString, IsArray, Min, IsUUID } from 'class-validator';
import { ModalidadOferta, TipoContrato } from './create-oferta.dto';

export class UpdateOfertaDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  requisitos?: string;

  @IsOptional()
  @IsString()
  beneficios?: string;

  @IsOptional()
  @IsEnum(ModalidadOferta)
  modalidad?: ModalidadOferta;

  @IsOptional()
  @IsEnum(TipoContrato)
  tipo_contrato?: TipoContrato;

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

  @IsOptional()
  @IsNumber()
  @Min(1)
  plazas_disponibles?: number;

  @IsOptional()
  @IsDateString()
  fecha_cierre?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  habilidades?: { id: string; obligatoria: boolean }[];
}