import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateConsultaDto {
  @IsNumber()
  @Min(1)
  id_paciente!: number;

  @IsNumber()
  @Min(1)
  id_medico!: number;

  @IsOptional()
  @IsDateString()
  fecha_consulta?: string; // Si no se proporciona, usa fecha actual

  @IsString()
  @MaxLength(1000)
  motivo_consulta!: string; // Razón de la consulta

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  examen_fisico?: string; // Hallazgos del examen físico

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  plan_tratamiento?: string; // Plan de tratamiento propuesto

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string; // Observaciones adicionales
}
