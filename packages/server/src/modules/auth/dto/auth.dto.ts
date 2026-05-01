import { IsEnum, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  EGRESADO = 'EGRESADO',
  EMPRESA = 'EMPRESA',
}

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsNotEmpty({ message: 'Password es requerido' })
  password: string;
}

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @MinLength(8, { message: 'Password debe tener al menos 8 caracteres' })
  password: string;

  @IsEnum(UserRole, { message: 'Rol inválido' })
  role: UserRole;
}

export class RegisterEgresadoDto extends RegisterDto {
  @IsNotEmpty({ message: 'Nombres es requerido' })
  nombres: string;

  @IsNotEmpty({ message: 'Apellidos es requerido' })
  apellidos: string;
}

export class RegisterEmpresaDto extends RegisterDto {
  @IsNotEmpty({ message: 'Nombre de empresa es requerido' })
  nombre: string;

  @IsNotEmpty({ message: 'NIT es requerido' })
  nit: string;
}
