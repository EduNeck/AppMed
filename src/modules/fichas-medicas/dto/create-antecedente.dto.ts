import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAntecedenteDto {
  @IsNumber()
  @Min(1)
  id_paciente!: number;

  @IsString()
  tipo!:
    | 'PERSONAL'
    | 'FAMILIAR'
    | 'ALERGICO'
    | 'QUIRURGICO'
    | 'FARMACOLOGICO'
    | 'SOCIAL';

  @IsString()
  @MaxLength(500)
  descripcion!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  fecha_estimada?: string; // Fecha aproximada cuando aplique
}
