import { IsArray, IsNumber } from 'class-validator';

export class SetMedicoEspecialidadesDto {
  @IsArray()
  @IsNumber({}, { each: true })
  especialidades!: number[]; // IDs de especialidades a asignar al médico
}
