import { IsOptional, IsEnum, IsBoolean, IsUUID, IsString, IsInt, Min, Max, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Genero } from './create-egresado.dto';

export class FilterEgresadoDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  carrera_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  anio_egreso?: number;

  @IsOptional()
  @IsBoolean()
  buscando_empleo?: boolean;

  @IsOptional()
  @IsEnum(Genero)
  genero?: Genero;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  habilidad_ids?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}