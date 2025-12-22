import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSignosVitalesDto {
  @IsNumber()
  @Min(1)
  id_consulta!: number; // Relacionado con una consulta específica

  @IsOptional()
  @IsNumber()
  @IsPositive()
  peso?: number; // en kg

  @IsOptional()
  @IsNumber()
  @IsPositive()
  altura?: number; // en cm

  @IsOptional()
  @IsNumber()
  @IsPositive()
  temperatura?: number; // en °C

  @IsOptional()
  @IsNumber()
  @Min(40)
  presion_sistolica?: number; // mmHg

  @IsOptional()
  @IsNumber()
  @Min(40)
  presion_diastolica?: number; // mmHg

  @IsOptional()
  @IsNumber()
  @IsPositive()
  frecuencia_cardiaca?: number; // latidos por minuto

  @IsOptional()
  @IsNumber()
  @IsPositive()
  frecuencia_respiratoria?: number; // respiraciones por minuto

  @IsOptional()
  @IsNumber()
  @Min(70)
  saturacion_oxigeno?: number; // porcentaje %

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
