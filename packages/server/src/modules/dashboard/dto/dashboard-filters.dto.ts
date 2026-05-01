import { IsOptional, IsDateString, IsUUID, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class DateRangeDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}

export class DashboardFiltersDto extends DateRangeDto {
  @IsOptional()
  @IsUUID()
  carreraId?: string;

  @IsOptional()
  @IsUUID()
  facultadId?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  pais?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(2020)
  @Max(2030)
  anioEgreso?: number;
}

export class AdminDashboardFiltersDto extends DashboardFiltersDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limite?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  topHabilidades?: number;
}

export class EmpresaDashboardFiltersDto extends DashboardFiltersDto {
  @IsOptional()
  @IsUUID()
  ofertaId?: string;
}

export class EgresadoDashboardFiltersDto extends DashboardFiltersDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limiteOfertas?: number;
}
