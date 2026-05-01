import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean, IsDateString, IsArray, Min, IsUUID } from 'class-validator';
import { ModalidadOferta, TipoContrato } from './create-oferta.dto';

export class FilterOfertaDto {
  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  pais?: string;

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
  @IsArray()
  @IsUUID('4', { each: true })
  habilidades?: string[];

  @IsOptional()
  @IsDateString()
  fecha_cierre_desde?: string;

  @IsOptional()
  @IsDateString()
  fecha_cierre_hasta?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}