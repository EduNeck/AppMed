import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEvolucionDto {
  @IsNumber()
  @Min(1)
  id_consulta!: number;

  @IsOptional()
  @IsDateString()
  fecha_evolucion?: string; // Si no se proporciona, usa fecha actual

  @IsString()
  @MaxLength(2000)
  descripcion!: string; // Evolución del paciente

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  plan_seguimiento?: string; // Plan de seguimiento

  @IsOptional()
  @IsString()
  estado?: 'MEJORADO' | 'ESTABLE' | 'EMPEORADO' | 'SIN_CAMBIOS';
}
