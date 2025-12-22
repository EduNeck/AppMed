import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMedicoDto {
  @IsString()
  @MaxLength(20)
  tipo_documento!: string; // ej: CEDULA, PASAPORTE

  @IsString()
  @MaxLength(30)
  numero_documento!: string;

  @IsString()
  @MaxLength(150)
  nombres!: string;

  @IsString()
  @MaxLength(150)
  apellidos!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MaxLength(50)
  numero_colegiatura!: string; // Número de colegiatura médica

  @IsOptional()
  @IsString()
  @MaxLength(300)
  direccion?: string;
}
