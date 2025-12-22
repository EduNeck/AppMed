import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDiagnosticoDto {
  @IsNumber()
  @Min(1)
  id_consulta!: number; // Relacionado con una consulta específica

  @IsString()
  @MaxLength(500)
  descripcion!: string; // Descripción del diagnóstico

  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigo_cie10?: string; // Código CIE-10 si aplica

  @IsOptional()
  @IsString()
  tipo?: 'PRINCIPAL' | 'SECUNDARIO' | 'DIFERENCIAL'; // Tipo de diagnóstico

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}
