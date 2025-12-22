import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMedicoDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tipo_documento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  numero_documento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombres?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  apellidos?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  numero_colegiatura?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  direccion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
