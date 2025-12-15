import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePacienteDto {
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
  @IsDateString()
  fecha_nacimiento?: string; // ISO: "1990-05-20"

  @IsOptional()
  @IsString()
  @MaxLength(10)
  sexo?: string; // M/F/O

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  direccion?: string;
}
