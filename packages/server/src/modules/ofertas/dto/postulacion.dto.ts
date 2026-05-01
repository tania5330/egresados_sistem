import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum EstadoPostulacion {
  POSTULADO = 'POSTULADO',
  EN_REVISION = 'EN_REVISION',
  ENTREVISTA = 'ENTREVISTA',
  CONTRATADO = 'CONTRATADO',
  RECHAZADO = 'RECHAZADO',
}

export class PostulacionDto {
  @IsString()
  oferta_id: string;

  @IsOptional()
  @IsString()
  carta_presentacion?: string;
}

export class ActualizarEstadoPostulacionDto {
  @IsString()
  postulacion_id: string;

  @IsEnum(['POSTULADO', 'EN_REVISION', 'ENTREVISTA', 'CONTRATADO', 'RECHAZADO'])
  estado: string;

  @IsOptional()
  @IsString()
  comentario?: string;
}